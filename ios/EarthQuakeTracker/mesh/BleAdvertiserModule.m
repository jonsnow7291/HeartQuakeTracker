#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(BleAdvertiser, NSObject)

RCT_EXTERN_METHOD(startAdvertising:(nonnull NSNumber *)manufacturerId
                  payloadBase64:(nonnull NSString *)payloadBase64
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(stopAdvertising:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(isAdvertising:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
