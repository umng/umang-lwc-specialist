import { api, LightningElement, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getBoats from '@salesforce/apex/BoatDataService.getBoats';
// Import message service features required for publishing and the message channel
import { publish, MessageContext } from 'lightning/messageService';
import BOATMC from '@salesforce/messageChannel/BoatMessageChannel__c';

const columns = [
    { label: 'Name', fieldName: 'Name', editable: true },
    { label: 'Length', fieldName: 'Length__c', editable: true },
    { label: 'Price', fieldName: 'Price__c', type: 'currency', editable: true },
    { label: 'Description', fieldName: 'Description__c', type: 'text', editable: true }
];
const SUCCESS_VARIANT = 'success';
const SUCCESS_TITLE = 'Success';
const MESSAGE_SHIP_IT = 'Ship It!';
const ERROR_VARIANT = 'error';
const CONST_ERROR = 'Error';

export default class BoatSearchResults extends LightningElement {
    boatTypeId = '';
    boats;
    selectedBoatId;
    isLoading = false;

    // wired message context
    @wire(MessageContext)
    messageContext;

    // wired getBoats method 
    @wire(getBoats, { boatTypeId: '$boatTypeId' })
    wiredBoats({ error, data }) {
        if (error) {
            // TODO: Error handling
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: JSON.stringify(error),
                variant: 'error'
            }));
            this.isLoading = false;
            this.notifyLoading();
        } else if (data) {
            // TODO: Data handling
            this.boats = data;
            this.isLoading = false;
            this.notifyLoading();
        }
    }

    updateSelectedTile(event) {
        this.selectedBoatId = event.detail.boatId;
        this.sendMessageService();
    }

    // Publishes the selected boat Id on the BoatMC.
    sendMessageService(boatId) {
        // explicitly pass boatId to the parameter recordId
        publish(this.messageContext, BOATMC, { recordId: boatId });
    }

    @api
    searchBoats(boatTypeId) {
        this.boatTypeId = boatTypeId;
        this.isLoading = true;
        this.notifyLoading();
    }

    refresh() {
        // refreshApex();
    }

    // The handleSave method must save the changes in the Boat Editor
    // passing the updated fields from draftValues to the 
    // Apex method updateBoatList(Object data).
    // Show a toast message with the title
    // clear lightning-datatable draft values
    handleSave(event) {
        // notify loading
        const updatedFields = event.detail.draftValues;
        // Update the records via Apex
        updateBoatList({ data: updatedFields })
            .then(result => {
                this.dispatchEvent(new ShowToastEvent({
                    title: SUCCESS_TITLE,
                    message: MESSAGE_SHIP_IT,
                    variant: SUCCESS_VARIANT
                }));
                this.refresh();
            })
            .catch(error => {
                // TODO Error handling
                this.dispatchEvent(new ShowToastEvent({
                    title: CONST_ERROR,
                    message: JSON.stringify(error),
                    variant: ERROR_VARIANT
                }));
            })
            .finally(() => { 
                this.isLoading = false;
                this.notifyLoading();
            });
    }

    // Check the current value of isLoading before dispatching the doneloading or loading custom event
    notifyLoading(isLoading) {
        this.dispatchEvent(new CustomEvent(this.isLoading ? 'loading' : 'doneloading'));
    }
}