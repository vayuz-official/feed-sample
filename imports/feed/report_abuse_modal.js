import { PopupUtils } from '../../../utils/PopupUtils';
import { Utils } from '../../../utils/utils';
import { FeedPosts,UserComments,AllGroups, AllDiscussions,event,RecentPosts , MiniBlogs,MiniBlogsdetail} from '../../../collections/collection';
import './report_abuse_modal.html';

const axios = require('axios').default;
Template.report_abuse.events({
"click .close-modal":function(event){
        event.preventDefault();
    $("#report_abuse-modal").removeClass("is-active");
  },
  "click .modal-background":function(event){
        event.preventDefault();
    $("#report_abuse-modal").removeClass("is-active");
  },
    "click #submit_report_as_abuse":function(){
        var isInappropriate = $("#styled-checkbox-2").prop("checked");
        var isFake = $("#styled-checkbox-3").prop("checked");
        var isHarmful = $("#styled-checkbox-4").prop("checked");
        console.log("isIappropriate:" + isInappropriate);    
        console.log("isFake:" + isFake);    
        console.log("isHarmful:" + isHarmful);    
        if(isInappropriate || isFake || isHarmful){
        $("#loader").removeClass("display_hidden");
            var obj = {};
            obj.user_id = Utils.getLoggedInUserId();
            obj.is_inappropriate =  isInappropriate;
            obj.is_fake =  isFake;
            obj.is_harmful =  isHarmful;
            obj.post_id = Session.get("reportedFeedPostId");
            obj.post_type = Session.get("reportedPostType");
            
             axios.post("/reportAbusivePost",obj)
             .then(function (response) {           
             console.log(response);      
              if(response.data.status==200){
                if(obj.post_type == 'feed'){
                    PopupUtils.showInfoPopup("Post marked as abusive");
                    var feedPosts=  FeedPosts._collection.remove({feed_id:obj.post_id});
                    var feedPosts=  RecentPosts._collection.remove({feed_id:obj.post_id});
                     $("#feed_dropdown_" + obj.post_id).removeClass("is-active");
                  if(FlowRouter.current().path.includes("feed-detail")){
                    FlowRouter.go("/feed");
                  }
                }else if(obj.post_type == 'comment' || obj.post_type == 'reply'){
                    PopupUtils.showInfoPopup(obj.post_type + " marked as abusive");
                    var feedPosts=  UserComments._collection.remove({comment_id:obj.post_id});
                     $("#feed_dropdown_" + obj.post_id).removeClass("is-active");
                }else if(obj.post_type == 'group'){
                  PopupUtils.showInfoPopup("Group marked as abusive");
                      AllGroups._collection.remove({group_id:obj.post_id});
                  
                  Session.set("total_groups",Session.get("total_groups")-1);
                  if(FlowRouter.current().path.includes("group-detail")  || 
                    FlowRouter.current().path.includes("discussion-detail")){
                    FlowRouter.go("/groups/all");
                  }
                }else if(obj.post_type == 'discussion'){
                  PopupUtils.showInfoPopup("Discussion marked as abusive");
                  AllDiscussions.remove({group_discussion_id:obj.post_id});
                  if(FlowRouter.current().path.includes("discussion-detail")){
                    FlowRouter.go("/discussion-listing/" + FlowRouter.current().params.groupId);
                  }
                }else if(obj.post_type == 'event'){
                  event.remove({event_id:obj.post_id});
                    PopupUtils.showInfoPopup("Event marked as abusive");
                  Session.set("total_events",Session.get("total_events")-1);
                  if(FlowRouter.current().path.includes("event-detail")){
                    FlowRouter.go("/events/all");
                  }
                }else if(obj.post_type == 'blog'){
                  Session.set("total_blogs",Session.get("total_blogs")-1);
                  MiniBlogs.remove({blog_id:obj.post_id});
                  MiniBlogsdetail.remove({blog_id:obj.post_id});
                  if(FlowRouter.current().path.includes("blog-detail")){
                    FlowRouter.go("/blogs/all");
                  }
                }
                $("#loader").addClass("display_hidden");
                $("#styled-checkbox-2").prop("checked",false);
                 $("#styled-checkbox-3").prop("checked",false);
                 $("#styled-checkbox-4").prop("checked",false);
                $("#report_abuse-modal").removeClass("is-active")
              }else{
                PopupUtils.showErrorPopupWithMessage("Something went wrong");       
              }
          })
          .catch(function (error) {
          //   PopupUtils.showErrorPopupWithMessage("Internet connectivity Issue");
          });	
        }else{
            PopupUtils.showErrorPopupWithMessage("Please select atleast one reason");
        }
    }
})