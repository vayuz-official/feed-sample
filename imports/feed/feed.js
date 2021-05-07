
import { PopupUtils } from '../../../utils/PopupUtils';
import { Utils } from '../../../utils/utils';
import { FeedPosts, LoggedInUser } from '../../../collections/collection';
import { isRegExp } from 'util';
import './feed.html';

const axios = require('axios').default;
var limit = 0;
var apiCalling ;


Template.feed.onRendered(function() {
    console.log("Loading Scripts");
    Session.set("isReady",false);
    Utils.loadScript();
    resetAttachedImages();
    Utils.fetchLoggedInUserDetails();
    // scrollToBottom();
})

function resetAttachedImages(){
    Session.set("total_uploaded_images",[]);
    Session.set("total_media",0);
    Session.set("request_send","true");
    Session.set("post_type","")
    Session.set("end_reached",false);
}




Template.feed.helpers({
  'pagination_loading':function(){
    return Session.get("pagination_loading");
  },
  isReady:function(){
    return Session.get("isReady")
  },
  end_reached:function(){
    return Session.get("end_reached");
  }
})

Template.feed.events({
  "click .app-overlay":function(events){
    events.preventDefault();
      if($("#compose-card").hasClass("is-highlighted")){
        $('.close-publish').click();   // esc
      }
    
  }
})