public with sharing class KnowledgeSearchCtrl {
    @AuraEnabled
    public static List<Knowledge__c> search(String searchText, String category, String formFactor){
        try {
            String queryString = 'SELECT Name, Category__c, Description__c' 
                                + ' FROM Knowledge__c'
                                + ' WHERE Name LIKE ' + '\'%' + String.escapeSingleQuotes(searchText) + '%\'';
                                // TODO: Add filter on Desciption
            if(String.isNotBlank(category)) {
                queryString += ' AND Category__c=\'' + category + '\'';
            }
            queryString += ' LIMIT 100';
            List<Knowledge__c> knowledgeList = Database.query(queryString);

            addknowledgeStatistics(knowledgeList, searchText);

            return knowledgeList;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    static void addknowledgeStatistics(List<Knowledge__c> knowledgeList, String searchText) {
        List<Knowledge_Statistics__c> knowledgeStatisticsList = new List<Knowledge_Statistics__c>();
        for(Knowledge__c knowledge: knowledgeList) {
            knowledgeStatisticsList.add(new Knowledge_Statistics__c(
                Name= searchText
            ));
        }
        insert knowledgeStatisticsList;
    }
}
