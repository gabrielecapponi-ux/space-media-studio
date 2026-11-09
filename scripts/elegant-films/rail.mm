// Rasterise the actual Blender surfaces through a moving calibrated camera.
// The two camera matrices use the same convention as Blender's projection.
#import <Foundation/Foundation.h>
#import <Metal/Metal.h>
#import <CoreGraphics/CoreGraphics.h>
#import <ImageIO/ImageIO.h>
#include <vector>
#include <cstdio>

static void require(BOOL condition, NSString *message) {
    if (!condition) { fprintf(stderr,"%s\n",message.UTF8String); exit(1); }
}
static void readMatrix(NSArray *values, float *m) {
    for (NSUInteger i=0; i<16; ++i) m[i]=[values[i] floatValue];
}
static id<MTLTexture> plate(id<MTLDevice> device, NSString *path) {
    NSURL *url=[NSURL fileURLWithPath:path];
    CGImageSourceRef src=CGImageSourceCreateWithURL((__bridge CFURLRef)url,nil);
    require(src!=nullptr,path);
    CGImageRef im=CGImageSourceCreateImageAtIndex(src,0,nil);
    NSUInteger w=CGImageGetWidth(im),h=CGImageGetHeight(im);
    std::vector<uint8_t> rgba(w*h*4);
    CGColorSpaceRef space=CGColorSpaceCreateWithName(kCGColorSpaceSRGB);
    CGContextRef ctx=CGBitmapContextCreate(rgba.data(),w,h,8,w*4,space,kCGImageAlphaNoneSkipLast|kCGBitmapByteOrder32Big);
    CGContextDrawImage(ctx,CGRectMake(0,0,w,h),im);
    MTLTextureDescriptor *descriptor=[MTLTextureDescriptor texture2DDescriptorWithPixelFormat:MTLPixelFormatRGBA8Unorm width:w height:h mipmapped:NO];
    descriptor.usage=MTLTextureUsageShaderRead;
    id<MTLTexture> tex=[device newTextureWithDescriptor:descriptor];
    [tex replaceRegion:MTLRegionMake2D(0,0,w,h) mipmapLevel:0 withBytes:rgba.data() bytesPerRow:4*w];
    CGContextRelease(ctx); CGColorSpaceRelease(space); CGImageRelease(im); CFRelease(src);
    return tex;
}
static const char *source=R"METAL(
#include <metal_stdlib>
using namespace metal;
struct Matrices { float4x4 view; float4x4 reference; };
struct V { float4 position [[position]]; float4 ref; float floor [[flat]]; };
vertex V vertex_main(uint i [[vertex_id]],device const packed_float3 *p [[buffer(0)]],constant Matrices &m [[buffer(1)]],constant uint2 &floorRange [[buffer(2)]]) {
    float4 world=float4(float3(p[i]),1);
    float4 clip=m.view*world;
    clip.z=.5*(clip.z+clip.w);
    return {clip,m.reference*world,float(i>=floorRange.x && i<floorRange.y)};
}
fragment float4 project(V f [[stage_in]],texture2d<float> image [[texture(0)]],depth2d<float> depths [[texture(1)]],texture2d<float> floorPlate [[texture(2)]],texture2d<float> alternate [[texture(3)]],constant float &fade [[buffer(0)]]) {
    constexpr sampler linear(coord::normalized, address::clamp_to_edge, filter::linear);
    constexpr sampler nearest(coord::normalized, address::clamp_to_edge, filter::nearest);
    float2 uv=f.ref.xy/f.ref.w*float2(.5,-.5)+.5;
    if(f.floor>.5)return float4(floorPlate.sample(linear,uv).rgb,1);
    float z=.5*f.ref.z/f.ref.w+.5;
    float nearestDepth=depths.sample(nearest,uv);
    // A rear surface may be revealed by the rail. Borrow a nearby reference
    // texel on its depth plane instead of repeating the foreground silhouette.
    if (z-nearestDepth>.00011) {
        const float2 rays[]={float2(1,0),float2(-1,0),float2(0,1),float2(0,-1),
                             float2(.707,.707),float2(-.707,.707),float2(.707,-.707),float2(-.707,-.707)};
        float2 pixel=1.0/float2(depths.get_width(),depths.get_height());
        bool found=false;
        for(float radius=1;radius<=110&&!found;radius=radius*1.45+1) {
            for(int j=0;j<8;++j) {
                float2 test=uv+rays[j]*pixel*radius;
                if(depths.sample(nearest,test)>=z-.0001) {uv=test; found=true;break;}
            }
        }
    }
    float3 a=image.sample(linear,uv).rgb; if(fade<.0001)return float4(a,1); float3 b=alternate.sample(linear,uv).rgb; return float4(pow(mix(pow(a,float3(2.2)),pow(b,float3(2.2)),fade),float3(1.0/2.2)),1);
}
)METAL";
int main(int argc,const char **argv) { @autoreleasepool {
    require(argc>=4,@"rail <folder> <profile> <proof|plates> [frame]");
    NSString *root=[NSString stringWithUTF8String:argv[1]],*profile=[NSString stringWithUTF8String:argv[2]],*photoFolder=[NSString stringWithUTF8String:argv[3]];
    NSString *folder=[root stringByAppendingPathComponent:profile];
    NSDictionary *plan=[NSJSONSerialization JSONObjectWithData:[NSData dataWithContentsOfFile:[folder stringByAppendingPathComponent:@"camera.json"]] options:0 error:nil];
    require(plan!=nil,@"Missing camera calibration");
    NSUInteger w=[plan[@"width"] unsignedIntegerValue], h=[plan[@"height"] unsignedIntegerValue];
    NSArray *shots=plan[@"shots"];
    NSData *geo=[NSData dataWithContentsOfFile:[root stringByAppendingPathComponent:@"bench.geometry"]];
    require(geo.length>8,@"Missing Blender mesh");
    const uint32_t *header=(const uint32_t*)geo.bytes;
    NSUInteger vc=header[0],ic=header[1];
    require(geo.length==8+vc*12+ic*4,@"Invalid mesh size");
    id<MTLDevice> d=MTLCreateSystemDefaultDevice(); require(d!=nil,@"Metal device unavailable");
    id<MTLCommandQueue> queue=[d newCommandQueue];
    id<MTLBuffer> vtx=[d newBufferWithBytes:header+2 length:vc*12 options:MTLResourceStorageModeShared];
    id<MTLBuffer> idx=[d newBufferWithBytes:header+2+vc*3 length:ic*4 options:MTLResourceStorageModeShared];
    NSError *error=nil;
    id<MTLLibrary> lib=[d newLibraryWithSource:[NSString stringWithUTF8String:source] options:nil error:&error];
    require(lib!=nil,error.localizedDescription);
    MTLRenderPipelineDescriptor *pipe=[MTLRenderPipelineDescriptor new];
    pipe.vertexFunction=[lib newFunctionWithName:@"vertex_main"];
    pipe.depthAttachmentPixelFormat=MTLPixelFormatDepth32Float;
    id<MTLRenderPipelineState> zpipe=[d newRenderPipelineStateWithDescriptor:pipe error:&error];
    require(zpipe!=nil,error.localizedDescription);
    pipe.fragmentFunction=[lib newFunctionWithName:@"project"];
    NSUInteger samples=[d supportsTextureSampleCount:4]?4:1;
    pipe.rasterSampleCount=samples;
    pipe.colorAttachments[0].pixelFormat=MTLPixelFormatBGRA8Unorm;
    id<MTLRenderPipelineState> renderPipe=[d newRenderPipelineStateWithDescriptor:pipe error:&error];
    require(renderPipe!=nil,error.localizedDescription);
    MTLDepthStencilDescriptor *zs=[MTLDepthStencilDescriptor new]; zs.depthWriteEnabled=YES; zs.depthCompareFunction=MTLCompareFunctionLessEqual;
    id<MTLDepthStencilState> depthState=[d newDepthStencilStateWithDescriptor:zs];
    auto texture=[&](MTLPixelFormat format, NSUInteger count, MTLStorageMode mode, MTLTextureUsage usage){
        MTLTextureDescriptor *t=[MTLTextureDescriptor texture2DDescriptorWithPixelFormat:format width:w height:h mipmapped:NO];
        t.storageMode=mode; t.usage=usage;
        if(count>1){t.textureType=MTLTextureType2DMultisample;t.sampleCount=count;}
        return [d newTextureWithDescriptor:t];
    };
    id<MTLTexture> output=texture(MTLPixelFormatBGRA8Unorm,1,MTLStorageModeShared,MTLTextureUsageRenderTarget);
    id<MTLTexture> color=samples==1?output:texture(MTLPixelFormatBGRA8Unorm,samples,MTLStorageModePrivate,MTLTextureUsageRenderTarget);
    id<MTLTexture> depth=texture(MTLPixelFormatDepth32Float,samples,MTLStorageModePrivate,MTLTextureUsageRenderTarget);
    uint32_t floorRange[2]={[plan[@"floor_vertices"][0] unsignedIntValue],[plan[@"floor_vertices"][1] unsignedIntValue]};
    auto draw=[&](id<MTLRenderCommandEncoder> e,id<MTLRenderPipelineState> pipeline,float *matrices){
        [e setRenderPipelineState:pipeline];[e setDepthStencilState:depthState];[e setCullMode:MTLCullModeNone];
        [e setVertexBuffer:vtx offset:0 atIndex:0];[e setVertexBytes:matrices length:128 atIndex:1];
        [e setVertexBytes:floorRange length:8 atIndex:2];
        [e drawIndexedPrimitives:MTLPrimitiveTypeTriangle indexCount:ic indexType:MTLIndexTypeUInt32 indexBuffer:idx indexBufferOffset:0];[e endEncoding];
    };
    NSMutableArray *colors=[NSMutableArray array], *depths=[NSMutableArray array], *floors=[NSMutableArray array], *alternate=[NSMutableArray array];
    for(NSDictionary *shot in shots){
        NSString *name=[shot[@"shot"] stringByAppendingPathExtension:@"png"];
        [floors addObject:plate(d,[[folder stringByAppendingPathComponent:@"floor"] stringByAppendingPathComponent:name])];
        [colors addObject:plate(d,[[folder stringByAppendingPathComponent:photoFolder] stringByAppendingPathComponent:name])];
        [alternate addObject:[shot[@"shot"] isEqualToString:@"optic"] ? plate(d,[folder stringByAppendingPathComponent:@"optic-alt.png"]) : [colors lastObject]];
        id<MTLTexture> base=texture(MTLPixelFormatDepth32Float,1,MTLStorageModePrivate,(MTLTextureUsage)(MTLTextureUsageRenderTarget|MTLTextureUsageShaderRead));
        MTLRenderPassDescriptor *pass=[MTLRenderPassDescriptor renderPassDescriptor];
        pass.depthAttachment.texture=base;pass.depthAttachment.clearDepth=1;pass.depthAttachment.loadAction=MTLLoadActionClear;pass.depthAttachment.storeAction=MTLStoreActionStore;
        id<MTLCommandBuffer> cmd=[queue commandBuffer];
        float m[32];readMatrix(shot[@"ref"],m);readMatrix(shot[@"ref"],m+16);
        draw([cmd renderCommandEncoderWithDescriptor:pass],zpipe,m);[cmd commit];[cmd waitUntilCompleted];require(!cmd.error,cmd.error.localizedDescription);
        [depths addObject:base];
    }
    fprintf(stderr,"%s: %lu triangles, %lux%lu, %lux MSAA\n",d.name.UTF8String,ic/3,w,h,samples);
    std::vector<uint8_t> bytes(w*h*4);
    int frameIndex=0;
    for(NSArray *segment in plan[@"order"]){
        int si=[segment[0] intValue];NSDictionary *shot=shots[si];
        for(int frame=[segment[1] intValue]; frame<[segment[2] intValue];++frame,++frameIndex){ @autoreleasepool{
            if(argc==5 && frameIndex!=atoi(argv[4]))continue;
            MTLRenderPassDescriptor *pass=[MTLRenderPassDescriptor renderPassDescriptor];
            auto attachment=pass.colorAttachments[0];
            attachment.texture=color;attachment.clearColor=MTLClearColorMake(0,0,0,1);attachment.loadAction=MTLLoadActionClear;
            attachment.storeAction=samples==1?MTLStoreActionStore:MTLStoreActionMultisampleResolve;
            if(samples>1)attachment.resolveTexture=output;
            pass.depthAttachment.texture=depth;pass.depthAttachment.loadAction=MTLLoadActionClear;pass.depthAttachment.clearDepth=1;
            pass.depthAttachment.storeAction=MTLStoreActionDontCare;
            id<MTLCommandBuffer> cmd=[queue commandBuffer];id<MTLRenderCommandEncoder> e=[cmd renderCommandEncoderWithDescriptor:pass];
            [e setFragmentTexture:colors[si] atIndex:0];[e setFragmentTexture:depths[si] atIndex:1];[e setFragmentTexture:floors[si] atIndex:2];
            [e setFragmentTexture:alternate[si] atIndex:3];
            float u=float(frame)/fmaxf(1.f,float([shot[@"poses"] count]-1));float rise=fminf(1.f,fmaxf(0.f,(u-.025f)/.63f)); float fade=si==1? .99f*rise*rise*(3.f-2.f*rise):0.f;[e setFragmentBytes:&fade length:sizeof(float) atIndex:0];
            float m[32];readMatrix(shot[@"poses"][frame],m);readMatrix(shot[@"ref"],m+16);
            draw(e,renderPipe,m);
            [cmd commit];[cmd waitUntilCompleted];require(!cmd.error,cmd.error.localizedDescription);
            [output getBytes:bytes.data() bytesPerRow:w*4 fromRegion:MTLRegionMake2D(0,0,w,h) mipmapLevel:0];
            require(fwrite(bytes.data(),1,bytes.size(),stdout)==bytes.size(),@"Encoder stopped");
        }}
    }
    return 0;
}}
