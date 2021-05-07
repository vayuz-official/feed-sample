import './like_modals.html';
Template.like_modals.events({
    "click .close-modal": function (event) {
        event.preventDefault();
        $("#all_likes_modal").removeClass("is-active");
      },
      "click .modal-background": function (event) {
        event.preventDefault();
        $("#all_likes_modal").removeClass("is-active");
      },
})