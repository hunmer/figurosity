
/*
 function alert(txt){     
      hsycms.alert('alert',txt,function(){
        hsycms.close('alert'); 
        console.log("点击了确定");
      })
   }

   //提示弹窗
   function tips(txt){
     hsycms.tips('tips',txt,function(){
       console.log("提示关闭后");
     },2000)
   }

   //询问弹窗
   function confirm(){
      hsycms.confirm('confirm','确定要这么做',
         function(res){            
            hsycms.success('success','点击了确定');
         },
        function(res){
            hsycms.error('error','点击了取消');
         },
      )
   }

   //操作成功调用 
   function success(){
     hsycms.success('success','操作成功',function(){  console.log('操作成功关闭后');  },1800)
   }

   //操作失败调用
   function error(){
    hsycms.error('error','操作失败',function(){  console.log('操作失败关闭后');  },1800)
   }

   //显示loading
   function loading(){
      hsycms.loading('loading','正在加载');
      //2秒后隐藏
      setTimeout(res=>{
         hsycms.hideLoading('loading');
      },2000)
   }


*/

/*
* hsycmsAlert 弹窗插件
* author @ http://www.hsycms.com 
*/
var hsycms =function(){ 
 return {
   //打开
   open:function(id,txt=''){     
     var obj = $("#"+id);
     $("#mask-"+id).fadeIn(300);
     obj.addClass("hsycms-ani-open");
     var height = obj.height();
     obj.css("margin-top", "-"+Math.ceil(height/2)+'px');  
     if(txt!=''){   
       obj.find(".hsycms-model-text").html(txt);  
     }  
     obj.show();
     setTimeout(res=>{
      obj.removeClass("hsycms-ani-open"); 
     },300)
   },

   //普通弹窗
			alert:function(id,txt='',callback){
						this.open(id,txt); 
						let that = this;
						$("#"+id).find(".hsycms-model-btn button").click(function(){  
										that.close(id);     
										if(typeof(callback)!='undefined'){ callback(); }
						})     
			},

    //提示弹窗
   tips:function(id,txt='',callback,time=1600){
    this.open(id,txt); 
    let that = this;
    setTimeout(res=>{  
     that.close(id);    
     if(typeof(callback)!='undefined'){ callback(); }
    },time)     
  },

   //询问弹窗
   confirm:function(id,txt='',confirm,concel){
      this.open(id,txt); 
      $("#"+id).find(".hsycms-model-btn button").click(function(){
         hsycms.close(id);
         if($(this).attr("class")=="ok"){           
          confirm();
         }else{
          concel();
         }
      })     
   },

   //自定义弹窗
   model:function(id){
      this.open(id); 
   },

  //显示loading
  loading:function(id,txt){   
    this.open('loading',txt);
  },

  //隐藏loading
  hideLoading(id,callback){
   this.close(id);
   if(typeof(callback)!='undefined'){ callback(); }
  },

  //操作成功提示
  success:function(id,txt,callback,time=1600){
   this.open(id,txt);
   let that = this;
   setTimeout(res=>{  
     that.close(id);    
     if(typeof(callback)!='undefined'){ callback(); }
   },time)
  },

  //操作失败提示
  error:function(id,txt,callback,time=1600){
   this.open(id,txt);
   let that = this;
   setTimeout(res=>{  
     that.close(id);    
     if(typeof(callback)!='undefined'){ callback(); }
   },time)
  },
   
  //关闭
  close:function(id){    
   var obj = $("#"+id);
   $("#mask-"+id).fadeOut(200);
   obj.addClass("hsycms-ani-close");   
   setTimeout(res=>{
    obj.hide();
    obj.removeClass("hsycms-ani-close"); 
   },300)
 },

 //关闭所有
 closeAll(){
    $(".hsycms-model-mask").fadeOut(200);
    $(".hsycms-model").addClass("hsycms-ani-close");   
    setTimeout(res=>{
     $(".hsycms-model").hide();
     $(".hsycms-model").removeClass("hsycms-ani-close"); 
    },300)
 }
  
 }
}();