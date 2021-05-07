
import { PopupUtils } from '../../../utils/PopupUtils';
import { Utils } from '../../../utils/utils';
import { RecentBlogs, LoggedInUser } from '../../../collections/collection';
const axios = require('axios').default;

Template.recent_blogs.helpers({
		'isRecentBlogsReady':function(){
			return Session.get("isRecentBlogsReady")
		},
		"fetch_all_recent_blogs":function(){
			return RecentBlogs.find({},{sort:{created_at:-1,limit: 3}}).fetch();
		},fetch_all_upcoming_event:function(){
      return Event.find({}).fetch()
    }
});

Template.recent_blogs.onRendered(function(){
	fetchAllLatestBlogFromTheNetwork();
})

function fetchAllLatestBlogFromTheNetwork(){
  var obj = {};
  obj.user_id = Utils.getLoggedInUserId();
  obj.type = "all";
  obj.query = "";
  if(FlowRouter.current().path.includes("blog-detail")){
  	var  id = FlowRouter.getParam('blogId');
  	obj.blog_detail_page_id =Utils.decodedEncodedString(id);
  }else{
  	obj.blog_detail_page_id = "";
  }

    Session.set("isRecentBlogsReady",false);
  var postFetcher = axios.post("/api/fetch_recent_blogs",obj);
  postFetcher.then(function (response) {
    // alert("Response");
    // console.log("Recent Blogs");
    // console.log(response);
    Session.set("isRecentBlogsReady",true);
    if(response.data.status==200){  
         for(var i=0;i<response.data.data.length;i++){
            RecentBlogs._collection.insert(response.data.data[i]);
        }
        Utils.loadScript();
      }
	})
	.catch(function (error) {
	  apiCalling = false;
});


} 

Template.recent_blogs.events({
  "click .blog_detail_redirection":function(event){
    window.location.href= "/blog-detail/" + Utils.encodeString(this.blog_id);
  }
})