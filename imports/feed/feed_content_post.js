import { PopupUtils } from "../../../utils/PopupUtils";
import { Utils } from "../../../utils/utils";
import { ErrorMessages } from "../../../utils/ErrorMessages";
import { FeedPosts, LoggedInUser } from "../../../collections/collection";
import Compressor from "compressorjs";
import './feed_content_post.html';
import { FeedNetwork } from "../../../network/itg/feed-network/feed-network";
import { SuggestionNetwork } from "../../../network/admin/common/SuggestionNetwork";

var ajaxRequest = undefined;
var counter = 1;
var uploadedDocumentType = [
  "jpg",
  "jpeg",
  "bmp",
  "gif",
  "png",
  "mp4",
  "JPG",
  "JPEG",
  "BMP",
  "GIF",
  "PNG",
  "MP4",
];
var attachedMediaIndexes = [];
let attachedImages = [];

function resetAttachedImages() {
  Session.set("total_uploaded_images", []);
  Session.set("total_media", 0);
  Session.set("request_send", "true");
  Session.set("post_type", "");
  Session.set("video_uploaded", false);
  $("#publish-button").addClass("is-disabled");
  attachedImages = [];
  $("#add_video_link").removeClass("video_already_added");
}

Template.feed_content_post.helpers({
  total_uploaded_images: function () {
    if (Session.get("total_uploaded_images")) {
      return Session.get("total_uploaded_images");
    } else {
      return [];
    }
  },
  video_uploaded: function () {
    return Session.get("video_uploaded");
  },
});

Template.feed_content_post.onRendered(function () {
  
  $(document).keyup(function (e) {
    if (e.which == 27) {
      if ($("#compose-card").hasClass("is-highlighted")) {
        $(".close-publish").click(); // esc
      }
    }
  });

  $.getScript("/bootstrap_typehead",function(){
    $.getScript("/mention",function(){
      // var tags = ["Jacob","Isabella","Ethan","Emma","Michael","Olivia","Alexander","Sophia","William","Ava","Joshua","Emily","Daniel","Madison","Jayden","Abigail","Noah","Chloe","你好"]; 
      try{
        $('#publish').atwho({
          at: "#",
          // data: tags,
          limit: 10,
          searchKey: "interest",
          displayTpl: "<li>${interest}</li>",
          insertTpl: "#${interest}",
          callbacks: {
            remoteFilter: async  function (query, callback) {
              if(query.length>1){
                var response = await new SuggestionNetwork().fetchSimilarHashtags(
                  query
                );
                if (Utils.isObject(response.data)) {
                  if (response.data.code == 200) {
                    var arr = [];
                    for (var i = 0; i < response.data.data.length; i++) {
                      response.data.data[i].interest_name = response.data.data[i].interest_name.replace("#","");
                      arr.push({interest:response.data.data[i].interest_name})
                    }
                    callback(arr);       
                  }
                }
                else{
                  PopupUtils.showErrorPopupWithMessage("Something went wrong");
                }
              }else{
                callback([])
              }
              
          },
            afterMatchFailed: function(at, el) {
              // 32 is spacebar
              if (at == '#') {
                tags.push(el.text().trim().slice(1));
                this.model.save(tags);
                this.insert(el.text().trim());
                return false;
              }
            }
          }
        });
      }catch(e){
        console.log("Exception");
        $.getScript("/bootstrap_typehead",function(){
          $.getScript("/mention",function(){
            console.log("Fixed");
          });
        });
      }
      
    })
  });

});

Template.feed_content_post.events({
  "keyup #publish": function (event) {
    event.preventDefault();
    if (!$("#uploading_data_div").hasClass("display_hidden")) {
      if (!$("#publish-button").hasClass("is-disabled"))
        $("#publish-button").addClass("is-disabled");
    }
    if (Session.get("total_uploaded_images").length == 0) {
      if ($("#publish").val().trim() != "") {
        if ($("#publish-button").hasClass("is-disabled"))
          $("#publish-button").removeClass("is-disabled");
      } else {
        $("#publish-button").addClass("is-disabled");
      }
    }
  },
  "focus #publish": function (event) {
    event.preventDefault();
    setTimeout(function () {
     try{
      if (
        !$("#compose-card").hasClass("is-highlighted") ||
        !$(".app-overlay").hasClass("is-active")
      ) {
        $("#compose-card").addClass("is-highlighted");
        $(".app-overlay").addClass("is-active");
      }
     }catch(e){
       console.log("Exception called")
     }
      
    }, 200);
  },
  "click #add_photos_link": function (event) {
    event.stopPropagation();

    // alert("Add add_photos_file_picker");
    if (
      !$("#compose-card").hasClass("is-highlighted") ||
      !$(".app-overlay").hasClass("is-active")
    ) {
      $("#compose-card").addClass("is-highlighted");
      $(".app-overlay").addClass("is-active");
    }
    document.getElementById("add_photos_file_picker_").click();
    event.target.value = "";
  },
  "click #add_video_link": function (event) {
    event.stopPropagation();

    if (!$("#add_video_link").hasClass("video_already_added")) {
      if (
        !$("#compose-card").hasClass("is-highlighted") ||
        !$(".app-overlay").hasClass("is-active")
      ) {
        $("#compose-card").addClass("is-highlighted");
        $(".app-overlay").addClass("is-active");
      }
      document.getElementById("add_videos_file_picker").click();
      // $("#").click();
      event.target.value = "";
    } else {
      PopupUtils.showInfoPopup("You can post only one video at a time");
    }
  },
  "change #add_videos_file_picker": async function (event, template) {
    event.stopPropagation();
    counter = 1;
    var maxCounter = event.currentTarget.files.length;
    Session.set("post_type", "media");
    for (i = 0; i < event.currentTarget.files.length; i++) {
      var type = event.currentTarget.files[i].type;
      const name = event.target.files[i].name;
      const lastDot = name.lastIndexOf(".");
      const fileName = name.substring(0, lastDot);
      const ext = name.substring(lastDot + 1);

      if (type.includes("video")) {
        if (uploadedDocumentType.includes(ext)) {
          if (Session.get("total_media") < 5) {
            Session.set(
              "total_media",
              parseInt(Session.get("total_media")) + 1
            );
            await upload_media(
              event,
              template,
              "photos",
              i,
              type,
              counter,
              maxCounter
            );
          } else {
            if (!$("#uploading_data_div").hasClass("display_hidden")) {
              $("#uploading_data_div").addClass("display_hidden");
            }
            PopupUtils.showErrorPopupWithMessage(
              "You can upload upto 5 media files maximum"
            );
            i++;
          }
        }
      } else {
        i++;
        PopupUtils.showErrorPopupWithMessage(
          fileName + "  rejected becuase of unsupported extension"
        );
      }
      counter++;
    }
  },
  "change #add_photos_file_picker_": async function (event, template) {
    event.stopPropagation();
    counter = 1;
    var maxCounter = event.currentTarget.files.length;
    Session.set("post_type", "media");
    for (i = 0; i < event.currentTarget.files.length; i++) {
      var type = event.currentTarget.files[i].type;
      const name = event.target.files[i].name;
      const lastDot = name.lastIndexOf(".");
      const fileName = name.substring(0, lastDot);
      const ext = name.substring(lastDot + 1);
      if (uploadedDocumentType.includes(ext)) {
        if (Session.get("total_media") < 5) {
          Session.set("total_media", parseInt(Session.get("total_media")) + 1);
          await upload_media(
            event,
            template,
            "photos",
            i,
            type,
            counter,
            maxCounter
          );
        } else {
          if (!$("#uploading_data_div").hasClass("display_hidden")) {
            $("#uploading_data_div").addClass("display_hidden");
          }
          PopupUtils.showErrorPopupWithMessage(
            "You can upload upto 5 media files maximum"
          );
          i++;
        }
      } else {
        i++;
        PopupUtils.showErrorPopupWithMessage(
          fileName + "  rejected becuase of unsupported extension"
        );
      }
      counter++;
    }
  },
  "paste #publish": function () {
    // event.preventDefault();
    setTimeout(function () {
      var urlInPastedString = $("#publish")
        .val()
        .match(/\bhttps?:\/\/\S+/gi);
      if (urlInPastedString.length != 0) {
        fetch_meta_information_in_url(urlInPastedString[0]);
      }
    }, 700);
  },
  "click .remove_meta": function (event) {
    event.preventDefault();
    resetMeta();
  },
  "click .close_discard": function (event) {
    event.preventDefault();
    $("#remove-modal").removeClass("is-active");
  },
  "click #confirm_discard": function (event) {
    event.preventDefault();
    $("#remove-modal").removeClass("is-active");
    $("#uploading_data_div").addClass("display_hidden");
    $(".app-overlay").removeClass("is-active");
    resetMeta();
    resetAttachedImages();
    $("#publish").val("");
    if (ajaxRequest != undefined) {
      console.log("Aborted");
      console.log(ajaxRequest);
      // ajaxRequest.cancel();
      ajaxRequest.abort();
      ajaxRequest = null;
    }
  },
  "click .close-publish": function (event) {
    event.preventDefault();
    if (
      Session.get("total_uploaded_images").length != 0 ||
      $("#publish").val().trim() != ""
    ) {
      $("#remove-modal").addClass("is-active");
      // $(".app-overlay").addClass("is-active")
    } else {
      $("#uploading_data_div").addClass("display_hidden");
      $(".app-overlay").removeClass("is-active");
      resetMeta();
      resetAttachedImages();
      $("#publish").val("");
      if (ajaxRequest != undefined) {
        console.log("Aborted");
        console.log(ajaxRequest);
        // ajaxRequest.cancel();
        ajaxRequest.abort();
        ajaxRequest = null;
      }
    }
  },
  "click .remove_image": function (event) {
    event.preventDefault();
    var current_image_id = this.image_id;
    var currentArray = Session.get("total_uploaded_images");
    var newArray = attachedImages.filter((x) => {
      return x.image_id != current_image_id;
    });
    attachedImages = newArray;

    var newArray = currentArray.filter((x) => {
      return x.image_id != current_image_id;
    });

    Session.set("total_uploaded_images", newArray);
    Session.set("total_media", newArray.length);
    if (Session.get("total_media") == 0) {
      $("#img-upload-form").removeClass("addimages-trip-nopadd");
      $("#img-upload-form").addClass("addimages-trip");
      $("#publish-button").addClass("is-disabled");
      $("#add_video_link").removeClass("video_already_added");
    }
  },
  "click #publish-button": function (event) {
    event.preventDefault();
    postNewContentFeed();
  },
});



function resetMeta() {
  $("#url_metadata_div").addClass("display_hidden");
  $("#metadata_source").text("");
  $("#metadata_title").text("");
  $("#metadata_image").attr("src", "");
  $("#metadata_url").attr("href", "");
  $("#metadata_description").text("");
  $("#add_photos_link").removeClass("display_hidden");
  $("#add_video_link").removeClass("display_hidden");
}
function upload_media(e, template, source, i, type, counter, maxCounter) {
  if (e.currentTarget.files && e.currentTarget.files[i]) {
    var file = e.currentTarget.files[i];
    if (file) {
      if (!type.includes("video")) {
        new Compressor(file, {
          quality: 0.6,
          maxHeight: 600,
          maxWidth: 850,
          success(result) {
            var form = new FormData();
            form.append("files", result);
            upload_content(
              form,
              e,
              template,
              source,
              i,
              type,
              counter,
              maxCounter
            );
          },
          error(err) {
            console.log(err.message);
          },
        });
      } else {
        // Session.set("video_uploaded",true);
        $("#add_video_link").addClass("video_already_added");
        var form = new FormData();
        form.append("files", file);
        upload_content(form, e, template, source, i, type, counter, maxCounter);
      }
    }
  }
}

async function upload_content(
  form,
  e,
  template,
  source,
  i,
  type,
  counter,
  maxCounter
) {
  var url = "/upload_files_content";
  if (Meteor.isCordova) {
    url =
      "https://cors-anywhere.herokuapp.com/https://nomd.life/upload_files_content";
  }
  var settings = {
    async: true,
    crossDomain: true,
    url: url,
    method: "POST",
    processData: false,
    contentType: false,
    mimeType: "multipart/form-data",
    data: form,
    headers: {
      "cache-control": "no-cache",
    },
  };
  if (i == 0) {
    $("#uploading_data_div").removeClass("display_hidden");
  }

  ajaxRequest = $.ajax(settings).done(function (response) {
    if (ajaxRequest != null) {
      if (
        $("#compose-card").hasClass("is-highlighted") &&
        $(".app-overlay").hasClass("is-active")
      ) {
        response = JSON.parse(response);

        var imageId = Date.now();
        attachedMediaIndexes.push(imageId);
        if (type.includes("video")) {
          attachedImages.push({
            image_id: imageId,
            media_type: "video",
            source_link: Utils.getS3Suffix() + response.s3_url,
            index: attachedMediaIndexes.length,
          });
        } else {
          attachedImages.push({
            image_id: imageId,
            media_type: "image",
            source_link: Utils.getS3Suffix() + response.s3_url,
            index: attachedMediaIndexes.length,
          });
        }
        $("#img-upload-form").addClass("addimages-trip-nopadd");
        $("#img-upload-form").removeClass("addimages-trip");
        Session.set("total_uploaded_images", attachedImages);

        $("#publish-button").removeClass("is-disabled");
        if (
          i == e.currentTarget.files.length - 1 ||
          Session.get("total_media") == 5
        ) {
          $("#uploading_data_div").addClass("display_hidden");
        }
      }
    }
  });
}

function isURL(str) {
  return new RegExp(
    "([a-zA-Z0-9]+://)?([a-zA-Z0-9_]+:[a-zA-Z0-9_]+@)?([a-zA-Z0-9.-]+\\.[A-Za-z]{2,4})(:[0-9]+)?(/.*)?"
  ).test(str);
}

function fetch_meta_information_in_url(output) {
  if (isURL(output)) {
    Session.set("post_type", "metadata_url");
    $("#uploading_data_div").removeClass("display_hidden");
    Meteor.call("fetch_url_information", output, function (error, result) {
      if (error) {
        $("#uploading_data_div").removeClass("display_hidden");
        swal("Please enter a valid URL");
      } else {
        console.log(result);
        if ($("#publish").val().trim() == "") {
          $("#url_metadata_div").addClass("display_hidden");
          $("#uploading_data_div").addClass("display_hidden");
          return false;
        }

        // if(Session.get("request_send")=="false"){
        $("#uploading_data_div").removeClass("display_hidden");
        $("#url_metadata_div").removeClass("display_hidden");
        Session.set("request_send", "true");
        var result_string = JSON.stringify(result);
        var title = JSON.parse(result_string);
        console.log(title);
        if (result_string.includes("code")) {
          $("#uploading_data_div").addClass("display_hidden");
          $("#url_metadata_div").addClass("display_hidden");
          swal("Sorry, Unable to fetch details!!!");
          return false;
        }
        console.log("2");
        if (title.image != "") {
          $("#metadata_image").attr("src", title.image);
        } else {
          $("#metadata_image").attr(
            "src",
            "/frontend-assets/images/logo/vu.png"
          );
        }
        $("#metadata_url").attr("href", title.url);

        var title1 = title.title;
        if (title1 == undefined) {
          $("#url_metadata_div").addClass("display_hidden");
          return false;
        }
        console.log("3");
        //   if(title1.length>38){
        $("#metadata_title").text(title1);
        //   }else{
        //   $("#metadata_title").text(title1);
        //   }
        console.log("4");
        $("#metadata_source").text(title.source);
        $("#metadata_description").text(title.description);
        $("#uploading_data_div").addClass("display_hidden");
        $("#add_photos_link").addClass("display_hidden");
        $("#add_video_link").addClass("display_hidden");
        // }
      }
    });
  } else {
    resetMeta();
  }
}

var requestSubmitted = false;
async function postNewContentFeed() {
  var content = $("#publish").val().replace(/\r?\n/g, "<br />").trim();
  var totalUploadedImages = Session.get("total_uploaded_images");
  var obj = {};
  obj.content = content;
  obj.totalUploadedImages = totalUploadedImages;
  obj.metadata_post = false;
  obj.metadata_details = {};
  if (
    obj.metadata_post == false &&
    content == "" &&
    totalUploadedImages.length == 0
  ) {
    PopupUtils.showErrorPopupWithMessage("Please add your thoughts to share!");
    return false;
  }
  if (!$("#url_metadata_div").hasClass("display_hidden")) {
    obj.metadata_post = true;
    obj.metadata_details.metadata_source = $("#metadata_source").text();
    obj.metadata_details.metadata_title = $("#metadata_title").text();
    obj.metadata_details.metadata_image = $("#metadata_image").attr("src");
    obj.metadata_details.metadata_url = $("#metadata_url").attr("href");
    obj.metadata_details.metadata_description = $(
      "#metadata_description"
    ).text();
  }
  obj.posted_by = localStorage.getItem("_id");
  $("#publish_loader").removeClass("display_hidden");
  if (requestSubmitted == false) {
    requestSubmitted = true;
    console.log(obj);
    var response = await new FeedNetwork().createFeedPost(obj);
    $("#publish_loader").addClass("display_hidden")
     if (Utils.isObject(response.data)) {
      if (response.data.code == 200) {
            if (obj.metadata_post) {
              resetMeta();
            }
            resetAttachedImages();

            response.data.new_post.is_creator = [{"1_id":"true"}];

            response.data.new_post.is_follower = [];
            response.data.new_post.is_following = [];

            FeedPosts._collection.insert(response.data.new_post);
            PopupUtils.showSuccessPopup("Post created!");
            $("#publish").val("");
            $(".close-publish").click();
            
      }else{
        PopupUtils.showSuccessPopup(response.data.message);
      }
    }else if (response.data.code == 403) {
      PopupUtils.showErrorMessageFromJWT();
      localStorage.setItem("_id", "");
      FlowRouter.go("/signin");
    }else {
      PopupUtils.showErrorPopupWithMessage(
        ErrorMessages.getNetworkTimeoutMessage()
      );
    } 

  
  }
}
