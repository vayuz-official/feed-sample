import { FeedLikes } from "../../../collections/collection";

Template.registerHelper("fetch_all_people_who_liked",function(){
    return FeedLikes.find({}).fetch();
})
Template.registerHelper("facebook_sharing_link",function(){
        return "https://www.facebook.com/sharer/sharer.php?u= " + Meteor.absoluteUrl() + "feed-detail/" + Session.get("sharedPostId");
})
Template.registerHelper("twitter_sharing_link",function(){
    return "https://twitter.com/share?url=" + Meteor.absoluteUrl() + "feed-detail/" + Session.get("sharedPostId");
})
Template.registerHelper("linkedin_sharing_link",function(){
    return "https://www.linkedin.com/shareArticle?mini=true&url=" + Meteor.absoluteUrl() + "feed-detail/" + Session.get("sharedPostId");;
})

Template.registerHelper("facebook_sharing_link_with_type",function(type){
    if(type =="event"){
        return "https://www.facebook.com/sharer/sharer.php?u= " + Meteor.absoluteUrl() + "event-details/" + FlowRouter.current().params.id;
    }
})
Template.registerHelper("twitter_sharing_link_with_type",function(type){
    
    if(type =="event"){
        return "https://twitter.com/share?url=" + Meteor.absoluteUrl() + "event-details/" + FlowRouter.current().params.id;
    }
})
Template.registerHelper("linkedin_sharing_link_with_type",function(type){
       if(type =="event"){
            return "https://www.linkedin.com/shareArticle?mini=true&url=" + Meteor.absoluteUrl() + "event-details/" + FlowRouter.current().params.id;    
        }
})

Template.registerHelper('applicable_cases',function(special_post,special_post_type){
    if(!special_post){
        return true;
    }
     if(special_post && special_post_type == 'blog' ){
        return false;
     }else{
        return false;
     }
})

