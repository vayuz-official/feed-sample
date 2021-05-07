import { Event } from '../../../collections/collection';
import { Utils } from '../../../utils/utils';

Template.upcoming_event_right_side.onCreated(function(){
	this.subscribe('fetch_all_upcoming_events',
	    	Meteor.subscribe("fetch_all_upcoming_events", Utils.getLoggedInUserId()));
});

Template.upcoming_event_right_side.helpers({
	fetch_all_upcoming_events:function(){
		var data  =  Event.find({},{sort:{created_at:-1}}).fetch();
			for (let i = 0; i < data.length; i++) {
               // data[i].from_date =  moment(data[i].from_date).format("MMM Do YYYY");
               // data[i].to_date =  moment(data[i].to_date).format("MMM Do YYYY");
                 data[i].from_date = Utils.convertToDesiredFormat(data[i].from_date);// moment(data[i].from_date).format("MMM Do YYYY");
               data[i].to_date =   Utils.convertToDesiredFormat(data[i].to_date);
            }
       return data;
	}
});

Template.upcoming_event_right_side.events({
	'click .event_detail_redirection':function(){
        window.location.href = "/event-details/" + Utils.encodeString(this.event_id);
    },
})