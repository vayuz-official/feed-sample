import { Advertisement } from '../../../collections/collection';

Template.side_ad.onRendered(function(){
	Meteor.subscribe("fetch_all_picture_ads",function(){
		setTimeout(function(){
			loadSlider()
		},500)
	})
});

function loadSlider(){
	var swiper = new Swiper('.swiper-container', {
      spaceBetween: 30,
      effect: 'fade',
      centeredSlides: true,
      autoplay: {
        delay: 2500,
        disableOnInteraction: false,
      }
    });
}
Template.side_ad.helpers({
	"fetch_all_picture_ads":function(){
		var data = Advertisement.find({"is_active":true,advertisement_type:"Image-Advertisement"},{sort:{created_at:-1}}).fetch()
		return data; 
	}
})


Template.side_ad.events({
	"click .swiper-slide":function(events){
		events.preventDefault();
		var win = window.open(this.advertisement_url, '_blank');
		win.focus();
	}	
})