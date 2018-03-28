//
//  MyCustomModule.m
//  Jack
//
//  Created by  Mr_183 on 2017/7/18.
//  Copyright © 2017年 Facebook. All rights reserved.
//

#import "MyCustomModule.h"
#import <SMS_SDK/SMSSDK.h>
@implementation MyCustomModule
RCT_EXPORT_MODULE();

// Available as NativeModules.MyCustomModule.processString
RCT_EXPORT_METHOD(getSMSSDK:(NSDictionary *)dic callback:(RCTResponseSenderBlock)callback)
{
  NSLog(@"接收到RN传过来的数据为:%@",dic);
  if ([dic[@"SMS_key"] isEqualToString:@"SMS_phoneNumber"] && ![dic[@"phoneNumber"] isEqualToString:@""]) {
    
    //发送
    [SMSSDK getVerificationCodeByMethod:SMSGetCodeMethodSMS phoneNumber:dic[@"phoneNumber"] zone:@"86" result:^(NSError *error) {
      __block NSString *code_Error =error.userInfo[@"code"];
      
      if (!error)
      {
        
        NSLog(@"成功了%@",error);
        
        // 验证成功
      }else{
        NSLog(@"失败==%@",error);
      }
      NSArray *events = [[NSArray alloc] initWithObjects:code_Error,nil];
      callback(@[[NSNull null], events]);

      
    }];
  }
  
  if ([dic[@"SMS_key"] isEqualToString:@"SMS_verifyCode"] && ![dic[@"verifyCode"] isEqualToString:@"1"] && ![dic[@"phoneNumber"] isEqualToString:@""]) {
    //验证
    
      [SMSSDK commitVerificationCode:dic[@"verifyCode"] phoneNumber:dic[@"phoneNumber"] zone:@"86" result:^(NSError *error) {

        __block NSString *code_Error =error.userInfo[@"code"];
        
        if (!error)
        {
          
          NSLog(@"成功了%@",error);
          
          // 验证成功
        }else{
          NSLog(@"失败==%@",error);
        }
        NSArray *events = [[NSArray alloc] initWithObjects:code_Error,nil];
        callback(@[[NSNull null], events]);
      }];
  }

//  NSArray *events = [[NSArray alloc] initWithObjects:@"张三",@"李四", nil];
//  callback(@[[NSNull null], events]);
  
}

@end
