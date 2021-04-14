import { LightningElement, track, wire } from 'lwc';
import doSearch from '@salesforce/apex/KnowledgeSearchCtrl.search';
import { ShowToastEvent } from 'lightning/platformShowToastEvent'
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import KNOWLEDGE_CATEGORY from '@salesforce/schema/Knowledge__c.Category__c';
import KNOWLEDGE_STATISTICS_OBJECT from '@salesforce/schema/Knowledge_Statistics__c';
import NAME_FIELD from '@salesforce/schema/Knowledge_Statistics__c.Name';
import KNOWLEDGE_FIELD from '@salesforce/schema/Knowledge_Statistics__c.Knowledge__c';
import DEVICE_FORM_FACTOR_FIELD from '@salesforce/schema/Knowledge_Statistics__c.Device_Form_Factor__c';
import FORM_FACTOR from '@salesforce/client/formFactor';
import { createRecord } from 'lightning/uiRecordApi';
import { NavigationMixin } from 'lightning/navigation';



export default class KnowledgeSearch extends LightningElement {
    @track searchText;
    @track searchResults;
    @track categoryOptions = [];
    @track categorySelected = '';
    @track isLoading = true;

    @wire(getPicklistValues, {
        recordTypeId: '012000000000000AAA',
        fieldApiName: KNOWLEDGE_CATEGORY
    }) wiredPickListValue({ data, error }) {
        this.isLoading = false;
        if (data) {
            var categoryOptions = [{
                label: 'All',
                value: ''
            }];
            categoryOptions.push(...data.values);
            this.categoryOptions = categoryOptions;
        }
        if (error) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: `Error while fetching Picklist values  ${error}`,
                variant: 'error'
            }));
        }
    }

    handleChange(event) {
        const field = event.target.name;
        if (field == "search") {
            this.searchText = event.target.value;
        }
        if (field == "category") {
            this.categorySelected = event.target.value;
        }
    }

    handleSearch(event) {
        if (this.validateSearch()) {
            this.isLoading = true;
            doSearch({
                searchText: this.searchText,
                category: this.categorySelected
            }).then((results) => {
                this.searchResults = results;
                this.isLoading = false;
            }).catch((err) => {
                this.isLoading = false;
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Error',
                    message: err.body.message,
                    variant: 'error'
                }));
            });
        }
    }

    validateSearch() {
        if (this.searchText && this.searchText != "") {
            return true;
        } else {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: 'Enter text to search.',
                variant: 'error'
            }));
            return false;
        }
    }

    createStatisticsRecord(event) {
        const fields = {};

        const knowledgeId = event.target.name;

        fields[NAME_FIELD.fieldApiName] = this.searchText;
        fields[KNOWLEDGE_FIELD.fieldApiName] = knowledgeId;
        fields[DEVICE_FORM_FACTOR_FIELD.fieldApiName] = FORM_FACTOR;
       
        // Creating record using uiRecordApi
        let recordInput = { apiName: KNOWLEDGE_STATISTICS_OBJECT.objectApiName, fields }
        this.isLoading = true;
        createRecord(recordInput)
        .then(result => {
            this.isLoading = false;
            window.location.href = '/' + knowledgeId;
            // Generate a URL to a User record page
            // this[NavigationMixin.GenerateUrl]({
            //     type: 'standard__recordPage',
            //     attributes: {
            //         recordId: knowledgeId,
            //         actionName: 'view',
            //     },
            // }).then(url => {
            //     this.recordPageUrl = url;
            // });
        })
        .catch(error => {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: JSON.stringify(error),
                variant: 'error'
            }));
        });
    }
}