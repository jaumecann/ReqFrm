var RequestSubType = ({
    name: "RequestSubType",

    clearDocTypeStatus: function () {
        Request.currentRecordDocTypeStatus.set("ID", null);
        Request.currentRecordDocTypeStatus.set("vcName", null);
        Request.set("currentRecord.intDocumentTypeStatusID", 0);
    },

    setbValidationIBCompliance: function () {
        var thirdPartyCategory = Request.getByID(Request.dsThirdPartyCategory, Request.currentRecord.intThirdPartyCategoryID);
        var serviceType = Request.getByID(Request.dsServiceType, Request.currentRecord.intServiceTypeID);

        if (thirdPartyCategory && thirdPartyCategory.vcCode != 'NA') {
            Request.set("currentRecord.bValidationIBCompliance", true);
        }
        else if (thirdPartyCategory && serviceType &&
            thirdPartyCategory.vcCode === 'NA' && serviceType.vcCode != 'Others') {
            Request.set("currentRecord.bValidationIBCompliance", true);
        } else {
            Request.set("currentRecord.bValidationIBCompliance", false);
        }
    },

    setStatusFilter: function () {
        RequestSubType.setDocumentTypeStatusFilter();
    },

    setDocumentTypeStatusFilter: function () {
        var currentFilter = Request.dsDocumentTypeStatus.getURLFilter();
        var newFilter = "intDocumentTypeID eq " + Request.currentRecord.intDocumentTypeID;

        if (!hasProgramRight("CanUseAllStatus")) {
            newFilter += ' and ( intTeamDocumentTypeStatus/any (t: t/dtDeactivateDate eq null ';
            newFilter += ' and t/intTeam/intTeamPerson/any (tp: tp/dtDeactivateDate eq null and tp/intPersonID eq ' + userBean.intID + ') ';
            newFilter += ' and t/intTeam/intTeamFirm/any (tf: tf/dtDeactivateDate eq null and tf/intFirmID eq ' + Request.currentRecord.intFirmID + ')) ) ';
        }

        if (currentFilter != newFilter) {
            Request.dsDocumentTypeStatus.setURLFilter(newFilter);
        }
    },

    setDocumentSubType() {
        if (Request.currentRecord.intDocumentSubTypeID !== null) {
            Request.intDocumentSubType = Request.currentRecord.intDocumentSubTypeID;
            Request.bSubTypeRequired = true;
        }
    },

    setDocumentSubTypeCode() {
        Request.dsDocumentSubType.read().then(function (e) {
            var documentSubType = Request.getByID(Request.dsDocumentSubType, Request.intDocumentSubType);
            if (documentSubType)
                Request.vcDocumentSubTypeCode = documentSubType.intCodeID;
        });
    },

    setDocumentSubTypeRequired: function () {
        var documentType = Request.getByID(Request.dsDocumentType, Request.currentRecord.intDocumentTypeID);

        if ((Request.vcDataModelCode === 'InvoiceReceived' || Request.vcDataModelCode === 'PurchaseOrder')
            && documentType
            && (documentType.vcCode === "InvRecWithPO" ||
            documentType.vcCode === "InvRecWithoutPM" ||
            documentType.vcCode === "InvRecWithoutPO" ||
            documentType.vcCode === "OtherBusinessPurchase" ||
            documentType.vcCode === "CentralizedPurchase")) {

            Request.bSubTypeRequired = true;
        }
    },

    bindRequiredsIfNotOldRequest: function () {
        var documentType = Request.getByID(Request.dsDocumentType, Request.currentRecord.intDocumentTypeID);

        if (Request.vcDataModelCode == 'InvoiceReceived') 
            this.bindInvoiceReceivedNewSubTypeRequireds(documentType);
        
        if (Request.vcDataModelCode == 'PurchaseOrder') 
            this.bindPurchaseNewSubTypeRequireds(documentType);  
    },

    bindInvoiceReceivedNewSubTypeRequireds: function (documentType) {
        if ((Request.vcDocumentSubTypeCode && Request.vcDocumentSubTypeCode !== 'INV10' && Request.vcDocumentSubTypeCode !== 'INV20' && Request.vcDocumentSubTypeCode !== 'INV31')
           || (!Request.currentRecord.intDocumentSubTypeID && Request.bSubTypeRequired))
        {
            var fieldsRequireds = []
            fieldsRequireds = ["vcReference", "intDocumentTypeID", "intDocumentTypeStatusID", "intFirmID", "dtInvoiceDate", "bIsResident", "bNeedResidenceCertificate", "dcAmount", "vcCurrentCertificate", "dcPaymentAmount", "intCurrencyID", "dtDueDate", "intPaymentMethodID", "intServiceTypeID", "intThirdPartyCategoryID"];
            Request.setBLRequiredProperties(fieldsRequireds, false);
            if (documentType)
                fieldsRequireds = this.setInvoiceReceivedDocTypeRequireds(documentType, fieldsRequireds);

            Request.setBLRequiredProperties(fieldsRequireds, true);
            kendo.bind($("#intDocumentType_intDocumentTypeDataModel_vcName"), Request);
        }
    },

    bindPurchaseNewSubTypeRequireds: function (documentType) {
        if ((Request.vcDocumentSubTypeCode && Request.vcDocumentSubTypeCode !== 'PO10' && Request.vcDocumentSubTypeCode !== 'PO20') ||
            (!Request.currentRecord.intDocumentSubTypeID && Request.bSubTypeRequired))
        {
            var fieldsRequireds = []
            fieldsRequireds = ["vcReference", "intDocumentTypeID", "intDocumentTypeStatusID", "intFirmID", "vcTitle", "vcRequisitioner", "vcPurchaseOrderNumber", "dtPurchaseOrderDate", "intPurchaseOrderTypeID", "dcAmount", "intCurrencyID", "intPurchasingTypeID", "vcReview", "intPurchaseOrderApprovalAreaID", "intCecoID", "intThirdPartyCategoryID", "intServiceTypeID"];

            Request.setBLRequiredProperties(fieldsRequireds, false);
            if (documentType)
                fieldsRequireds = this.setPurchaseOrderDocTypeRequireds(documentType, fieldsRequireds);

            Request.setBLRequiredProperties(fieldsRequireds, true);
            kendo.bind($("#intDocumentType_intDocumentTypeDataModel_vcName"), Request);
        }
    },

    setInvoiceReceivedDocTypeRequireds: function (documentType, fieldsRequireds) {
        Request.blNotRequiredProperties = [];
        if (documentType.vcCode != "InvRecWithoutPO")
            Request.blNotRequiredProperties.push('intServiceTypeID', 'intThirdPartyCategoryID');

        return fieldsRequireds.filter(field => !Request.blNotRequiredProperties.includes(field));
    },

    setPurchaseOrderDocTypeRequireds: function (documentType, fieldsRequireds) {
        Request.blNotRequiredProperties = [];
        if (documentType.vcCode === "OtherBusinessPurchase") {
            if (Request.purchasingTypeCode)
                this.setPurchasingTypeRequireds(Request.purchasingTypeCode);
        }

        if (documentType.vcCode != "OtherBusinessPurchase") {
            Request.blNotRequiredProperties = ['intServiceTypeID', 'intThirdPartyCategoryID', 'intCecoID'];

            if (Request.poTypeCode)
                this.setPOTypeRequireds(Request.poTypeCode);
        }

        return fieldsRequireds.filter(field => !Request.blNotRequiredProperties.includes(field));
    },

    setPurchasingTypeRequireds: function (purchasingType) {
        if (purchasingType !== "PAOPaymentAuthorizationOrder" && purchasingType !== "DirectPurchasesLessThan10000")
            Request.blNotRequiredProperties.push('intServiceTypeID', 'intThirdPartyCategoryID');
    },

    setPOTypeRequireds: function (POType) {
        if (POType === "FrameworkAgreement")
            Request.blNotRequiredProperties.push('intPurchaseOrderApprovalAreaID', 'vcReference', 'vcPurchaseOrderNumber');

        if (POType === "OneOffOrdersMoreThan100000")
            Request.blNotRequiredProperties.push('intPurchaseOrderApprovalAreaID', 'vcReference');
    },

    toggleCecoField() {
        if (Request.vcDataModelCode === 'PurchaseOrder') {
            if (Request.currentRecord.intCecoID) {
                return (Request.getByID(Request.dsCeco, Request.currentRecord.intCecoID))
                    ? RequestSubType.removeField(".ceco-view-field")
                    : RequestSubType.removeField(".ceco-manage-field");
            } else {
                return RequestSubType.removeField(".ceco-view-field");
            }
        }
    },

    togglePurchasingTypeField() {
        if (Request.vcDataModelCode === 'PurchaseOrder' && Request.vcDocumentSubTypeCode &&
            (Request.vcDocumentSubTypeCode === 'PO10' || Request.vcDocumentSubTypeCode === 'PO20') &&
            Request.purchasingTypeCode) {

            if (Request.purchasingTypeCode === "Delegated10000To1000000") {
                Request.set("purchasingTypeLegacyName", "Delegated 6.000 € - 30.000 €");
                return RequestSubType.removeField(".purchasingType-manage-field");

            } else if (Request.purchasingTypeCode === "DirectPurchasesLessThan10000") {
                Request.set("purchasingTypeLegacyName", "Direct Purchase < 6.000 €");
                return RequestSubType.removeField(".purchasingType-manage-field");

            } else if (Request.purchasingTypeCode === "CentralizedMoreThan100000") {
                Request.set("purchasingTypeLegacyName", "Centralized > 30.000 €");
                return RequestSubType.removeField(".purchasingType-manage-field");
            }
        }
        return RequestSubType.removeField(".purchasingType-view-field");
    },

    togglePOTypeField() {
        if (Request.vcDataModelCode === 'PurchaseOrder' && Request.vcDocumentSubTypeCode &&
            (Request.vcDocumentSubTypeCode === 'PO10' || Request.vcDocumentSubTypeCode === 'PO20') &&
            Request.poTypeCode) {

            if (Request.poTypeCode === "OneOffOrdersMoreThan100000") {
                Request.set("poTypeLegacyName", "One off Orders > 30.000 €");
                return RequestSubType.removeField(".poType-manage-field");
            }
        }
        return RequestSubType.removeField(".poType-view-field");
    },

    removeField(field) {
        $(field).remove();
    },

    refreshIntDocumentSubTypeStatusIDEnabled() {
        var isServiceTypeRequired = $('#intServiceTypeID')[0].hasAttribute("required");
        var isThirdPartyCategoryRequired = $('#intThirdPartyCategoryID')[0].hasAttribute("required");

        if (Request.vcDataModelCode === 'InvoiceReceived'
            && Request.currentRecord
            && Request.currentRecord.intDocumentTypeID) {
            RequestSubType.setDocumentTypeStatusEnabledIfSubTypeAllows(isServiceTypeRequired, isThirdPartyCategoryRequired, false);

        } else if (Request.vcDataModelCode === 'PurchaseOrder' && Request.currentRecord && Request.currentRecord.intDocumentTypeID
            && Request.currentRecord.intPurchaseOrderTypeID && Request.currentRecord.intPurchasingTypeID) {
            var isCecoRequired = $('#intCecoID')[0].hasAttribute("required");
            RequestSubType.setDocumentTypeStatusEnabledIfSubTypeAllows(isServiceTypeRequired, isThirdPartyCategoryRequired, isCecoRequired);

        } else {
            Request.setBLEditableProperty("intDocumentTypeStatusID", false);
        }
    },

    setDocumentTypeStatusEnabledIfSubTypeAllows(isServiceTypeRequired, isThirdPartyCategoryRequired, isCecoRequired) {

        if ((!isServiceTypeRequired || (isServiceTypeRequired && Request.currentRecord.intServiceTypeID))
            && (!isThirdPartyCategoryRequired || (isThirdPartyCategoryRequired && Request.currentRecord.intThirdPartyCategoryID))
            && (!isCecoRequired || (isCecoRequired && Request.currentRecord.intCecoID))) {

            Request.setBLEditableProperty("intDocumentTypeStatusID", true);
        } else {
            Request.setBLEditableProperty("intDocumentTypeStatusID", false);
        }
    },

    refreshPurchaseEditableFields() {
        var documentTypeStatus = Request.getByID(Request.dsDocumentTypeStatus, Request.currentRecord.intDocumentTypeStatusID);
        var documentType = Request.getByID(Request.dsDocumentType, Request.currentRecord.intDocumentTypeID);

        if (documentTypeStatus && documentTypeStatus.vcName != 'Pending Approval'
            && documentType && documentType.vcName === "Other Business Purchases"
            && Request.vcDocumentSubTypeCode && Request.vcDocumentSubTypeCode !== 'PO20') {

            Request.setBLEditableProperty("intCecoID", false);
            Request.setBLEditableProperty("intPurchasingTypeID", false);
            Request.setBLEditableProperty("intPurchaseOrderTypeID", false);
            Request.setBLEditableProperty("intDocumentTypeID", false);

            if (Request.purchasingTypeCode &&
                (Request.purchasingTypeCode === "PAOPaymentAuthorizationOrder" || Request.purchasingTypeCode === "DirectPurchasesLessThan10000")) {
                Request.setBLEditableProperty("intServiceTypeID", false);
                Request.setBLEditableProperty("intThirdPartyID", false);
            }
        }

        if (documentTypeStatus && documentTypeStatus.vcName != 'Pending Approval'
            && documentType && documentType.vcName === "Centralized Purchase"
            && Request.vcDocumentSubTypeCode && Request.vcDocumentSubTypeCode !== 'PO10') {
            Request.setBLEditableProperty("intPurchaseOrderTypeID", false);
        }
    },


    refreshIntServiceTypeIDEnabled() {
        if (Request.withPO) {
            Request.setBLEditableProperty("intServiceTypeID", false);
        } else {
            Request.setBLEditableProperty("intServiceTypeID", true);
        }
    },

    setServiceTypeOptionLabel() {
        if (Request.withPO &&
            Request.currentRecord && !Request.currentRecord.intPurchaseOrderID) {
            $("#intServiceTypeID").kendoDropDownList({
                optionLabel: "Select a Purchase Order"
            });
        } else {
            $("#intServiceTypeID").kendoDropDownList({
                optionLabel: "Select Concept..."
            });
        }
    },

    setIntServiceTypeNull() {
        Request.set("currentRecord.intServiceTypeID", null);
    },

    getServiceTypeValue() {
        if (Request.currentRecord.intPurchaseOrderID) {
            let urlParams = `?intPurchaseOrderID=${Request.currentRecord.intPurchaseOrderID}`;
            $.ajax({
                url: `odata/DocumentInvoiceReceiveds/GetServiceTypeValue${urlParams}`,
                type: 'POST',
                success: (data) => {
                    Request.set("currentRecord.intServiceTypeID", null);
                    if (data && data.value) {
                        Request.set("currentRecord.intServiceTypeID", data.value);
                    }
                    kendo.bind($("#intServiceTypeID"), Request);
                },
                error: hyKendo.error.hyErrorHandler.handleAJAXException,
                complete: () => {
                    $.unblockUI();
                }
            });
        }
    },

    getSubTypeCreateDateFormatted() {
        if (!Request.currentRecord.dtCreateDate) {
            Request.dtCreateDateFormatted = kendo.toString(new Date(kendo.date.today()), "u");
        } else {
            var strdate = parseFloat(Request.currentRecord.dtCreateDate.replace("/", "").replace("Date(", "").replace(")", ""));
            var jsd = kendo.toString(new Date(strdate), "u");
            Request.dtCreateDateFormatted = jsd;
        }
    },

    getDocumentTypeCode(documentType) {
        return (documentType ? documentType.vcCode : "");
    },

    getServiceTypeCode(serviceType) {
        return (serviceType ? serviceType.vcCode : "");
    },

    getThirdPartyCategoryCode(thirdPartyCategory) {
        return (thirdPartyCategory ? thirdPartyCategory.vcCode : "");
    },

    getCecoCode(ceco) {
        return (ceco ? ceco.vcApprovedByCode : "");
    },

    getDocumentSubType() {
        if (Request.vcDataModelCode === 'InvoiceReceived' && Request.bSubTypeRequired) {

            RequestSubType.getInvoiceReceivedDocumentSubType();

        } else if (Request.vcDataModelCode === 'PurchaseOrder' && Request.bSubTypeRequired) {

            RequestSubType.getPurchaseDocumentSubType();

        }
    },

    getInvoiceReceivedDocumentSubType() {
        var documentType = Request.getByID(Request.dsDocumentType, Request.currentRecord.intDocumentTypeID);
        var serviceType = Request.getByID(Request.dsServiceType, Request.currentRecord.intServiceTypeID);
        var thirdPartyCategory = Request.getByID(Request.dsThirdPartyCategory, Request.currentRecord.intThirdPartyCategoryID);

        RequestSubType.getSubTypeCreateDateFormatted();
        var serviceTypeCode = RequestSubType.getServiceTypeCode(serviceType);
        var thirdPartyCategoryCode = RequestSubType.getThirdPartyCategoryCode(thirdPartyCategory);
        var docTypeCode = RequestSubType.getDocumentTypeCode(documentType);
        var intDocumentSubTypeID = Request.currentRecord.intDocumentSubTypeID;

        if (documentType) {
            let urlParams = `?vcDocCreateDate=${Request.dtCreateDateFormatted}&vcDocumentType=${docTypeCode}&vcServiceType=${serviceTypeCode}&vcThirdPartyCategory=${thirdPartyCategoryCode}&intDocumentSubTypeID=${intDocumentSubTypeID}`;
            $.ajax({
                url: `odata/DocumentInvoiceReceiveds/AssignDocumentSubType${urlParams}`,
                type: 'POST',
                success: (data) => {
                    if (data) {
                        Request.set("intDocumentSubType", data.value);
                        RequestSubType.setDocumentSubTypeCode();
                        Request.getNextStatus(Request.currentRecord.intFirmID, Request.currentRecord.intDocumentTypeID, Request.currentRecord.intDocumentTypeStatusID, Request.intDocumentSubType);
                        RequestSubType.setStatusFilter();
                    }
                },
                error: hyKendo.error.hyErrorHandler.handleAJAXException,
                complete: () => {
                    $.unblockUI();
                }
            });
        }
    },

    getPurchaseDocumentSubType() {
        var documentType = Request.getByID(Request.dsDocumentType, Request.currentRecord.intDocumentTypeID);
        var purchasingType = Request.getByID(Request.dsPurchasingType, Request.currentRecord.intPurchasingTypeID, "intPurchasingTypeID");
        var POType = Request.getByID(Request.dsPurchaseOrderType, Request.currentRecord.intPurchaseOrderTypeID, "intPurchaseOrderTypeID");
        var serviceType = Request.getByID(Request.dsServiceType, Request.currentRecord.intServiceTypeID);
        var thirdPartyCategory = Request.getByID(Request.dsThirdPartyCategory, Request.currentRecord.intThirdPartyCategoryID);
        var ceco = Request.getByID(Request.dsCeco, Request.currentRecord.intCecoID);

        RequestSubType.getSubTypeCreateDateFormatted();
        var serviceTypeCode = RequestSubType.getServiceTypeCode(serviceType);
        var thirdPartyCategoryCode = RequestSubType.getThirdPartyCategoryCode(thirdPartyCategory);
        var cecoCode = RequestSubType.getCecoCode(ceco);
        var docTypeCode = RequestSubType.getDocumentTypeCode(documentType);
        var intDocumentSubTypeID = Request.currentRecord.intDocumentSubTypeID;

        if (documentType && POType && purchasingType) {
            let urlParams = `?vcDocCreateDate=${Request.dtCreateDateFormatted}&vcDocumentType=${docTypeCode}&vcPOType=${POType.intPurchaseOrderType_vcCode}&vcPurchasingType=${purchasingType.intPurchasingType_vcCode}&vcServiceType=${serviceTypeCode}&vcThirdPartyCategory=${thirdPartyCategoryCode}&ceco=${cecoCode}&intDocumentSubTypeID=${intDocumentSubTypeID}`;
            $.ajax({
                url: `odata/DocumentPurchaseOrders/AssignDocumentSubType${urlParams}`,
                type: 'POST',
                success: (data) => {
                    if (data) {
                        Request.set("intDocumentSubType", data.value);
                        RequestSubType.setDocumentSubTypeCode();
                        Request.getNextStatus(Request.currentRecord.intFirmID, Request.currentRecord.intDocumentTypeID, Request.currentRecord.intDocumentTypeStatusID, Request.intDocumentSubType);
                        RequestSubType.setStatusFilter();
                    }
                },
                error: hyKendo.error.hyErrorHandler.handleAJAXException,
                complete: () => {
                    $.unblockUI();
                }
            });
        }
    },

    purchaseSubTypeInputsAlert() {
        if (Request.vcDataModelCode === 'PurchaseOrder') {
            RequestSubType.setRequiredInputsAlert('ceco-alert', $('#intCecoID')[0].hasAttribute("required"));
            RequestSubType.setRequiredInputsAlert('purchasing-alert', $('#intPurchasingTypeID')[0].hasAttribute("required"));
            RequestSubType.setRequiredInputsAlert('POType-alert', $('#intPurchaseOrderTypeID')[0].hasAttribute("required"));
            RequestSubType.setRequiredInputsAlert('concept-alert', $('#intServiceTypeID')[0].hasAttribute("required"));
            RequestSubType.setRequiredInputsAlert('SAPCat-alert', $('#intThirdPartyCategoryID')[0].hasAttribute("required"));
        }
    },

    invoiceSubTypeInputsAlert() {
        if (Request.vcDataModelCode === 'InvoiceReceived') {
            RequestSubType.setRequiredInputsAlert('concept-alert', $('#intServiceTypeID')[0].hasAttribute("required"));
            RequestSubType.setRequiredInputsAlert('SAPCat-alert', $('#intThirdPartyCategoryID')[0].hasAttribute("required"));
        }
    },

    setRequiredInputsAlert(inputID, isRequired) {
        if (isRequired && (!$('#' + inputID).hasClass("k-icon") || !$('#' + inputID).hasClass("k-i-warning"))) {
            $('#' + inputID).addClass('k-icon');
            $('#' + inputID).addClass('k-i-warning');
        } else if (!isRequired && ($('#' + inputID).hasClass("k-icon") || $('#' + inputID).hasClass("k-i-warning"))) {
            $('#' + inputID).removeClass('k-icon');
            $('#' + inputID).removeClass('k-i-warning');
        }
    }

});


