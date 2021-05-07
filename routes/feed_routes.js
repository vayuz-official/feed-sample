import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { FlowRouterTitle } from "meteor/ostrio:flow-router-title";
import { Utils } from "./../../../utils/utils";

var title = "India Today Gaming";
function checkedForLoggedIn() {
  if (
    Utils.getLoggedInUserId() == "" ||
    Utils.getLoggedInUserId() == null ||
    Utils.getLoggedInUserId() == undefined
  ) {
    FlowRouter.go("/");
  }
}
// ======================  Home page
FlowRouter.triggers.enter([
  () => {
    if ($(".navbar-menu").hasClass("is-active")) {
      $(".navbar-menu").removeClass("is-active");
      $(".navbar-burger").removeClass("is-active");
    }
    window.scrollTo(0, 0);
  },
]);

function getCorrectHeader() {
  if(Utils.getLoggedInUserId() != "" && Utils.getLoggedInUserId() != undefined ){
    return "header_itg";
  }else{
    return "header_home";
  }
  
}
FlowRouter.route("/feed/tag/:tag", {
  action:async  function (params, queryParams) {
    await import('/imports/loader/loader.js');
    await import('/imports/no_data/no_data.js');
    await import('/imports/no_data/no_data_image.js');
    await import('/imports/master.js');
    await import('/imports/frontend/footer.js');
    await import('/imports/frontend/header/header_itg.js');
    await import('/imports/icons/icons.js');
    await import('/imports/loader/uploading_data_loader.js');
    await import('/imports/frontend/feed/shimmer/left_shimmer.js');
    await import('/imports/frontend/feed/shimmer/middle_shimmer.js');
    await import('/imports/frontend/feed/short_profile.js');
    await import('/imports/frontend/feed/like_modals.js');
    await import('/imports/frontend/feed/feed_master.js');
    await import('/imports/frontend/feed/feed_content_post.js');
    await import('/imports/frontend/feed/check_for_new_post.js');
    await import('/imports/frontend/feed/feed_listing.js');
    await import('/imports/frontend/feed/feed.js');
    await import('/imports/frontend/feed/report_abuse_modal.js');
    await import('/public/frontend-assets/css/style.css');
    await import('/imports/frontend/profile/profile-itg/profile.css');
    await import('/public/frontend-assets/css/app.css');
    await import('/public/frontend-assets/css/core.css');
    BlazeLayout.render("header_itg", {
      child_template_forntend: "feed",
      feed_listing: 'feed_listing'
    });
  },
  title(params, query, data) {
    return "Feed | " + title;
  },
});

FlowRouter.route("/feed", {
  action:async  function (params, queryParams) {
    await import('/imports/loader/loader.js');
    await import('/imports/no_data/no_data.js');
    await import('/imports/no_data/no_data_image.js');
    await import('/imports/master.js');
    await import('/imports/frontend/footer.js');
    await import('/imports/frontend/header/header_itg.js');
    await import('/imports/icons/icons.js');
    await import('/imports/loader/uploading_data_loader.js');
    await import('/imports/frontend/feed/shimmer/left_shimmer.js');
    await import('/imports/frontend/feed/shimmer/middle_shimmer.js');
    await import('/imports/frontend/feed/short_profile.js');
    await import('/imports/frontend/feed/like_modals.js');
    await import('/imports/frontend/feed/feed_master.js');
    await import('/imports/frontend/feed/feed_content_post.js');
    await import('/imports/frontend/feed/check_for_new_post.js');
    await import('/imports/frontend/feed/feed_listing.js');
    await import('/imports/frontend/feed/feed.js');
    await import('/imports/frontend/feed/report_abuse_modal.js');
    await import('/public/frontend-assets/css/style.css');
    await import('/imports/frontend/profile/profile-itg/profile.css');
    await import('/public/frontend-assets/css/app.css');
    await import('/public/frontend-assets/css/core.css');
    BlazeLayout.render("header_itg", {
      child_template_forntend: "feed",
      short_profile:'short_profile',
      feed_content_post:'feed_content_post',
      feed_listing: 'feed_listing'
    });
  },
  title(params, query, data) {
    return "Feed | " + title;
  },
});


FlowRouter.route("/feed-detail/:post_id", {
  action:async  function (params, queryParams) {
    await import('/imports/loader/loader.js');
    await import('/imports/no_data/no_data.js');
    await import('/imports/no_data/no_data_image.js');
    await import('/imports/master.js');
    await import('/imports/frontend/footer.js');
    await import('/imports/frontend/header/header_itg.js');
    await import('/imports/icons/icons.js');
    await import('/imports/frontend/feed/like_modals.js');
    await import('/imports/frontend/feed/feed_master.js');
    await import('/imports/frontend/commenting/commenting.js');
    await import('/imports/frontend/feed_detail/feed_detail.js');
    await import('/imports/frontend/feed/report_abuse_modal.js');
   
    await import('/public/frontend-assets/css/style.css');
    await import('/imports/frontend/profile/profile-itg/profile.css');
    await import('/public/frontend-assets/css/app.css');
    await import('/public/frontend-assets/css/core.css');
    BlazeLayout.render("header_itg", {
      child_template_forntend: "feed_detail",
      commenting:'commenting'
    });
  },
  title(params, query, data) {
    return "Feed Detail | " + title;
  },
});
