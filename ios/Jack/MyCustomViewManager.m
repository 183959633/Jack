//
//  MyCustomViewManager.m
//  Jack
//
//  Created by  Mr_183 on 2017/7/18.
//  Copyright © 2017年 Facebook. All rights reserved.
//

#import "MyCustomViewManager.h"

@implementation MyCustomViewManager
RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[MyCustomViewManager alloc] init];
}

RCT_EXPORT_VIEW_PROPERTY(myCustomProperty, NSString);
@end
