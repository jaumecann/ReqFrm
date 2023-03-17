var Request = new hyModelViewEdit({
    name: "Request",
    hasRequestLoaded: false,
    withPO: false,
    withPORequired: false,
    currentRecord: null,
    docsUpload: null,
    vcLoSCode: null,
    vcCountryNameAndISO: null,
    vcDataModelCode: null,
    entityModel: null,
    entityFields: {}, // para poder bindear no puede ser null
    lblLoS: "",
    lblEntryDate: "",
    vcResident: '',
    vcNeedCertificateResidence: null,
    vcReview: null,
    filterDocTypeFromCompany: null,
    filterDocTypeFromDataModel: null,
    bIsHistoric: false,
    bExportEnabled: false,
    bDeleteVisible: userBean.canDeleteDocument,
    bDeleteEnabled: false,
    NotificationModule: null,
    bNotificationCreationEnabled: false,
    canHandleNotification: userBean.canHandleNotification,
    documentTypeNotificationEnabled: false,
    allowAddNotification: false,
    showNotifications: false,
    settingNeedCertificateResidenceInitialValue: false,
    paymentAmountAuto: false,
    useThirdPartyVatAccount: false,
    dtChangeVatPaymentToThirdPartyVatAccount: null,
    allowSelectOriginNotification: true,
    allowAddOriginNotification: false,
    originNotification: null,
    originNotificationID: null,
    intDocumentSubType: null,
    vcDocumentSubTypeCode: null,
    nextStatus: null,
    settingOriginNotificationID: false,
    intPurchaseOrderApprovedByControlStatusIDs: null,
    purchasingTypeLegacyName: null,
    poTypeLegacyName: null,
    purchasingTypeCode: null,
    poTypeCode: null,
    //#region datasources
    dataSource: new hyDataSourceJSON({
        URLsufix: '',
        hyController: "DocumentInherited/getDocument",
        hyAddViewIDToURL: true,
        hyForceDisableCache: true,
        hyAddViewIDToURLQueryparamName: "id",
        requestEnd: function (e) {
            if ((e.type == "read") && (typeof (e.response) != 'undefined') && (e.response.length != 0)) {
                // hay que asignar el modelo dinámicamente a partir de lo que se ha descargado
                var record = e.response[0];
                Request.setDataModel(record.intDocumentType_intDocumentTypeDataModel_vcCode);
                Request.vcLoSCode = record.vcLoSCode;
                Request.setCountry(record.intFirm_intCountry_vcName, record.intFirm_intCountry_chISOCode2);
                Request.setCecoFilter(record.intFirm_intCountry_vcName);
                Request.set("withPO", record.intDocumentType_bEditablePurchaseOrder);
                Request.set("withPORequired", record.intDocumentTypeStatus_intDocumentTypeDataModelStatusBase_bRequirePurchaseOrder);
                Request.dataSource.options.schema.model = Request.entityModel;
                Request.set("lblLoS", record.vcLoSName);
                Request.set("lblEntryDate", kendo.toString(kendo.parseDate(record.dtEntryDate), 'dd/MM/yyyy'));
                Request.set('bIsHistoric', record.bIsHistoric);
                Request.set("bDeleteEnabled", true);

                Request.setViewCapability(record.dtDeactivateDate);
            }
        }
    }),

    refreshAllowAddNotification() {
        if (this.canHandleNotification && this.documentTypeNotificationEnabled) {
            this.set("allowAddNotification", true);
        }
        else {
            this.set("allowAddNotification", false);
        }
    },
    refreshShowNotifications() {
        if (this.documentTypeNotificationEnabled || this.dsNotification.data().length > 0) {
            this.set("showNotifications", true);
        }
        else {
            this.set("showNotifications", false);
        }
    },
    dsYesNO_Review: new kendo.data.DataSource({
        data: [
            { vcName: "Yes", ID: 'true' },
            { vcName: "No", ID: 'false' }
        ]
    }),
    dsYesNO_Resident: new kendo.data.DataSource({
        data: [
            { vcName: "Resident", ID: 'true' },
            { vcName: "Not resident", ID: 'false' }
        ]
    }),
    dsYesNO_NeedResidenceCertificate: new kendo.data.DataSource({
        data: [
            { vcName: "Yes", ID: 'true' },
            { vcName: "No", ID: 'false' }
        ]
    }),
    dsYesNONotApplies: new kendo.data.DataSource({
        data: [
            { vcName: "Yes", ID: 'true' },
            { vcName: "No", ID: 'false' },
            { vcName: "N/A", ID: 'notapplies' }
        ]
    }),
    dsAttachmentType: new hyDataSourceOdata({
        hyController: "AttachmentType",
        hyEntityName: "AttachmentType",
        schema: { model: tblAttachmentType }
    }),

    dsDocumentAction: new hyDataSourceOdata({
        hyController: "DocumentAction",
        hyEntityName: "DocumentAction",
        culture: "en-US",
        hyFilter: "ID eq -1",
        hyExpands: "intPerson,intDocumentTypeStatus,intCurrency,intPaymentMethod,intThirdParty, intThirdPartyAccount, intThirdPartyVatAccount",
        schema: { model: tblDocumentAction },
        sort: { field: "dtActionDate", dir: "desc" },
        change: function (e) {
            if (this.data().length > 0) {
                Request.set("bExportEnabled", true);
            }
        }
    }),
    dsDocumentAttachment: new hyDataSourceOdata({
        hyEntityName: "DocumentAttachment",
        hyExpands: "intPerson,intDocument,intAttachmentType,intTeam",
        hyFilter: "ID eq -1",
        sort: { field: "dtCreateDate", dir: "desc" }
    }),
    dsTalk: new hyDataSourceOdata({
        hyEntityName: "Talk",
        hyFilter: "ID eq -1",
        hyExpands: "intPerson,intDocument",
        sort: { field: "dtCreateDate", dir: "desc" }
    }),
    dsNotification: new hyDataSourceOdata({
        hyEntityName: "DocumentSubmitionNotification",
        hyExpands: "intAttachment",
        hyFilter: "ID eq -1",
        sort: { field: "dtCreateDate", dir: "desc" },
        change: function (e) {
            Request.refreshShowNotifications();
        }
    }),
    dsFirm: new hyDataSourceOdata({
        hyEntityName: "Firm",
        hyExpands: "intCountry",
        serverFiltering: false,
        serverPaging: false, // hay pocos, no merece la pena paginar
        sort: { field: "vcName", dir: "asc" },
        pageSize: 1000
    }),
    dsThirdParty: new hyDataSourceOdata({
        hyEntityName: "ThirdParty",
        hyExpands: "intThirdPartyType",
        pageSize: 10,
        hySelect: 'ID,vcNameAndVATNumber,vcVATNumber,vcCode,vcIBAN,vcSWIFT,intCurrencyID,intPaymentMethodID,intThirdPartyCategoryID',
        sort: { field: "vcNameAndVATNumber", dir: "asc" }
    }),
    dsDocumentTypeStatus: new hyDataSourceOdata({
        hyEntityName: "DocumentTypeStatus",
        hyExpands: "intDocumentTypeDataModelStatusBase",
        hySelect: 'ID,vcName,intDocumentTypeDataModelStatusBase/bRequirePurchaseOrder',
        pageSize: 1000,
        sort: { field: "intOrder", dir: "asc" }
    }),
    dsDocumentType: new hyDataSourceOdata({
        hyEntityName: "DocumentType",
        hySelect: 'ID,vcName,intDocumentTypeDataModel/vcName,bEditablePurchaseOrder, bIsPurchase, bIsFrameworkContractNoRequired,bIsPurchaseOrderSRMTenderRequired, vcCode',
        hyExpands: "intDocumentTypeDataModel",
        pageSize: 1000,
        sort: { field: "vcName", dir: "asc" },
        requestEnd: function (e) {
            if (e.type === "read" && Request.currentRecord.intDocumentType_intDocumentTypeDataModel_vcName == "" && e.response.value.length > 0) {
                Request.set("currentRecord.intDocumentType_intDocumentTypeDataModel_vcName", e.response.value[0].intDocumentTypeDataModel.vcName);
                kendo.bind($("#intDocumentType_intDocumentTypeDataModel_vcName"), Request);
            }
        }
    }),
    dsPurchaseOrders: new hyDataSourceOdata({
        hyEntityName: "DocumentPurchaseOrder",
        pageSize: 10,
        hyExpands: "intDocumentType, intDocumentType/intDocumentTypeDataModel, intDocumentTypeStatus/intDocumentTypeStatusBase, intFirm"
    }),

    dsItemGroup: new hyDataSourceOdata({
        hySelect: 'ID,vcName, bIsPurchase',
        hyEntityName: "ItemGroup",
        pageSize: 100
    }),

    dsAssignedTo: new hyDataSourceJSON({
        URLsufix: '',
        hyController: "AssignedToJSON/getPersons",
        //hyEntityName: "Person",        
        hyForceDisableCache: true,
        pageSize: 1000,
        sort: { field: "vcName", dir: "asc" },
        hyReadParameters: { intDocumentTypeID: -1 },
        //HACK: Ilógicamente, en ocasiones, en producción (no se ha conseguido reproducir en test), casca porque hace la llamada sin los hyReadParameters… Por lo que nos comemos el error
        error: () => { }
    }),
    dsLoS: new hyDataSourceOdata({
        hyEntityName: "LoS",
        sort: { field: "vcName", dir: "asc" }
    }),
    dsTaxType: new hyDataSourceOdata({
        hyEntityName: "TaxType",
        sort: { field: "vcName", dir: "asc" },
        pageSize: 100
    }),
    dsThirdPartyAccount: new hyDataSourceOdata({
        hyEntityName: "ThirdPartyAccount",
        hySelect: 'ID, vcIBAN, vcSWIFT',
        sort: { field: "vcIBAN", dir: "asc" },
        hyFilter: "ID eq -1",
        serverPaging: false,
        pageSize: 1000
    }),
    dsThirdPartyVatAccount: new hyDataSourceOdata({
        hyEntityName: "ThirdPartyAccount",
        hySelect: 'ID, vcIBAN, vcSWIFT',
        sort: { field: "vcIBAN", dir: "asc" },
        hyFilter: "ID eq -1",
        serverPaging: false,
        pageSize: 1000
    }),
    dsPaymentMethod: new hyDataSourceOdata({
        hyEntityName: "PaymentMethod",
        hySelect: 'ID, vcName, bRequiresThirdPartyAccount',
        sort: { field: "vcName", dir: "asc" }
    }),

    dsPurchasingType: new hyDataSourceOdata({
        hyEntityName: "PurchasingTypeDocumentType",
        hyExpands: "intPurchasingType",
        hySelect: 'ID,intPurchasingTypeID, intPurchasingType/vcName, intPurchasingType/vcCode, intPurchasingType/bIsFrameworkContractNoRequired,intPurchasingType/bIsPurchaseOrderSRMTenderRequired',
        sort: { field: "intPurchasingType_vcName", dir: "asc" }
    }),

    dsPurchaseOrderType: new hyDataSourceOdata({
        hyEntityName: "PurchaseOrderTypePurchasingType",
        hyExpands: "intPurchaseOrderType",
        hySelect: 'ID,intPurchaseOrderTypeID, intPurchaseOrderType/vcName, intPurchaseOrderType/vcCode, intPurchaseOrderType/bIsFrameworkContractNoRequired,intPurchaseOrderType/bIsPurchaseOrderSRMTenderRequired',
        sort: { field: "intPurchaseOrderType_vcName", dir: "asc" }
    }),

    dsOriginNotification: new hyDataSourceOdata({
        hyEntityName: "AllNotification",
        hyFilter: "ID eq -1",
        sort: [{ field: "intDaysLeft", dir: "asc" }]
    }),

    dsServiceType: new hyDataSourceOdata({
        hyEntityName: "ServiceType",
        hySelect: 'ID,vcName,vcCode',
        sort: { field: "intOrderID", dir: "asc" }
    }),

    dsPurchaseOrderApprovalArea: new hyDataSourceOdata({
        hyEntityName: "PurchaseOrderApprovalArea",
        hySelect: 'ID,vcName,vcCode',
        sort: { field: "intOrderID", dir: "asc" }
    }),

    dsThirdPartyCategory: new hyDataSourceOdata({
        hyEntityName: "ThirdPartyCategory",
        hySelect: 'ID,vcName,vcCode',
        sort: { field: "intOrderID", dir: "asc" }
    }),

    dsDocumentSubType: new hyDataSourceOdata({
        hyEntityName: "DocumentSubType",
        hySelect: 'ID,intDocumentTypeID,vcName,intCodeID',
        sort: { field: "intOrderID", dir: "asc" },
        pageSize: 1000
    }),

    dsCeco: new hyDataSourceOdata({
        hyEntityName: "Ceco",
        hySelect: 'ID,vcName,vcCode,vcApprovedByCode',
        transport: {
            read: {
                type: 'POST',
                contentType: "application/json; charset=utf-8",
                url: ROOT_URL + "odata/Cecos/GetManageCecos",
                dataType: null
            }
        },
        change: function (e) {
            RequestSubType.toggleCecoField();
        },
        sort: { field: "intOrderID", dir: "asc" },
        pageSize: 1000
    }),

    //#endregion

    //#region aplicar filtros según se van indicando valores
    setCecoFilter: function (country) {
        if (Request.vcDataModelCode === 'PurchaseOrder')
            Request.dsCeco.setURLFilter(country === 'Qatar' ? "vcApprovedByCode eq 'QATAR'" : "vcApprovedByCode ne 'QATAR'");
    },

    setLoSFilters: function () {
        var defFilter = "intLoS/vcCode eq '" + Request.vcLoSCode + "'";
        defFilter += " and (intDocumentTypeFirm/any (dtf: dtf/intDocumentType/intDocumentTypeDataModel/vcCode eq '" + Request.vcDataModelCode + "')) ";
        if (!hasProgramRight('CanSeeAllFirms')) {
            defFilter += " and (intTeamFirm/any (tf: tf/intTeam/TeamDocumentTypes/any (dtf: dtf/intDocumentType/intDocumentTypeDataModel/vcCode eq '" + Request.vcDataModelCode + "') and tf/intTeam/intTeamPerson/any (tp: tp/intPersonID eq " + userBean.intID + ") and  tf/dtDeactivateDate eq null)) ";
        }
        if (Request.currentRecord.intFirmID) {
            defFilter += " and ((bIsDisabled eq false) or (bIsDisabled eq true and ID eq " + Request.currentRecord.intFirmID + "))";
        } else {
            defFilter += " and (bIsDisabled eq false)";
        }

        Request.dsFirm.setURLFilter(defFilter);
    },
    setThirdParyFilterFromFirm: function (isInitialLoad) {
        var currentFirmCountryID = Request.currentRecord.intFirm_intCountryID;
        var bShowEmployeeThirdParty = (Request.vcDataModelCode == 'PayrollSS' || Request.vcDataModelCode == 'GESPA');

        var currentThirdPartyCountryID = Request.currentRecord.intThirdParty_intCountryID;
        var currentThirdPartyFilter = Request.dsThirdParty.getURLFilter();
        var thirdPartyFilter = "ID eq -1";

        if (currentFirmCountryID != null)
            thirdPartyFilter = "((bIsCommon eq true) or (bIsCommon eq false and intCountryID eq " + currentFirmCountryID + "))";

        if (bShowEmployeeThirdParty === false)
            thirdPartyFilter += " and (intThirdPartyType/vcCode ne 'Person') ";

        thirdPartyFilter += " and (bIsDisabled eq false) "; //no mostramos los desactivados

        if (currentThirdPartyFilter != thirdPartyFilter) {
            Request.dsThirdParty.setURLFilter(thirdPartyFilter);
            if (!isInitialLoad) {
                // hay que refrescar el ds
                Request.dsThirdParty.read().then(function (e) {
                    //Request.hyBindContents(); // para que el combo se posicione en el registro que toca. Pero provoca una descarga de más al hacer un bing = recarga el grid de actions
                    kendo.bind($("#divThirdParty"), Request);
                });
            }
        }
        //else kendo.bind($("#divThirdParty"), Request); // para que sea editable de nuevo. Ya no hace falta ni en la creación ni en la edición

        if ((currentFirmCountryID == null && currentThirdPartyCountryID !== null) || (currentFirmCountryID !== null && currentThirdPartyCountryID !== null && currentFirmCountryID !== currentThirdPartyCountryID)) {
            Request.currentRecord.intThirdPartyID == null;
            Request.currentRecord.intThirdParty_intCountryID = null;
            // si ya está bindeado esto no creo que lo limpie, pero el fetch sí lo hará
        }
    },

    setOriginNotificationFilterFromFirm: function () {
        if (Request.allowSelectOriginNotification) {
            var originNotificationFilter;
            if (!Request.currentRecord.intFirmID) {
                originNotificationFilter = "ID eq -1";
            } else {
                originNotificationFilter = "intDocumentID eq null and bIsAcknowledgeOrSubmited eq false and intFirmID eq " + Request.currentRecord.intFirmID;
            }
            Request.dsOriginNotification.setURLFilter(originNotificationFilter);
            Request.dsOriginNotification.read().then();
        }
    },
    setIBANFromThirdParty: function (value) {
        Request.set("currentRecord.vcIBAN", value);
        Request.set("currentRecord.intThirdParty_vcIBAN", value);
        kendo.bind($("#vcIBAN"), Request);
    },
    setIBANFromThirdPartyAccount: function (value) {
        Request.set("currentRecord.intThirdPartyAccountID", value);
        kendo.bind($("#intThirdPartyAccountID"), Request);
    },
    setSWIFTFromThirdParty: function (value) {
        Request.set("currentRecord.vcSWIFT", value);
        Request.set("currentRecord.intThirdParty_vcSWIFT", value);
        kendo.bind($("#vcSWIFT"), Request);
    },
    setSWIFTFromThirdPartyAccount: function (value) {
        Request.set("currentRecord.vcSWIFT", value);
        Request.set("currentRecord.intThirdPartyAccount_vcSWIFT", value);
        kendo.bind($("#vcSWIFT"), Request);
    },
    setCurrencyFromThirdParty: function (intCurrencyID) {
        Request.set("currentRecord.intCurrencyID", intCurrencyID);
        kendo.bind($("#intCurrencyID"), Request);
    },
    setPaymentMethodFromThirdParty: function (intPaymentMethodID) {
        Request.set("currentRecord.intPaymentMethodID", intPaymentMethodID);
        kendo.bind($("#intPaymentMethodID"), Request);
    },
    setDataModelFilters: function () {
        var doctypefilter = "ID eq -1";
        //PENDIENTE DE REVISAR
        var doctypefilterLos = "DocumentTypeFirms/any (l: l/intFirm/intLoS/vcCode eq '" + Request.vcLoSCode + "' and dtDeactivateDate eq null )";
        var DataModelknown = false;
        if (Request.vcDataModelCode == null) {
            if (Request.currentRecord != null && Request.currentRecord.intDocumentType_intDocumentTypeDataModel_vcCode != null) {
                Request.setDataModel(Request.intDocumentType_intDocumentTypeDataModel_vcCode);
            }
        }
        DataModelknown = Request.vcDataModelCode != null;
        if (DataModelknown) {
            doctypefilter = "intDocumentTypeDataModel/vcCode eq '" + Request.vcDataModelCode + "'";
            doctypefilter += "and " + doctypefilterLos;
        }
        this.filterDocTypeFromDataModel = doctypefilter;
        this.setDocumentTypeFilter();
    },
    setDocumentTypeFilter: function () {
        var doctypefilter = this.filterDocTypeFromCompany;
        if (this.filterDocTypeFromDataModel != null) {
            doctypefilter = (doctypefilter === null ? "" : doctypefilter + " and ") + this.filterDocTypeFromDataModel;
        }
        // se gestionan los subtipos de documento que esten incluidos en el team de la persona
        doctypefilter += ' and TeamDocumentTypes/any(tdt:tdt/intTeam/intTeamPerson/any (tp: tp/dtDeactivateDate eq null and tp/intPersonID eq ' + userBean.intID + ') and tdt/dtDeactivateDate eq null)';

        this.dsDocumentType.setURLFilter(doctypefilter);
    },
    setThirdPartyAccountFilter: function (thirdpartyid) {
        var thirdpartyfilter = "intThirdPartyID eq " + (thirdpartyid == null ? "-1" : thirdpartyid);
        thirdpartyfilter += " and bIsDisabled eq false and bVatBankAccount eq false";
        this.dsThirdPartyAccount.setURLFilter(thirdpartyfilter);
        this.dsThirdPartyAccount.read();

        var thirdpartyfilterVat = "intThirdPartyID eq " + (thirdpartyid == null ? "-1" : thirdpartyid);
        thirdpartyfilterVat += " and bIsDisabled eq false and bVatBankAccount eq true";
        this.dsThirdPartyVatAccount.setURLFilter(thirdpartyfilterVat);
        this.dsThirdPartyVatAccount.read();

        Request.set("currentRecord.intThirdPartyAccountID", null);
        kendo.bind($("#intThirdPartyAccountID"), Request);
        Request.set("currentRecord.intThirdPartyAccount_vcSWIFT", '');
        kendo.bind($("#vcSWIFT"), Request);
    },
    //#endregion
    setCountry: function (vcName, vcISO) {
        if (vcName != undefined) {
            Request.vcCountryNameAndISO = vcName + ' (' + vcISO + ')';
        }
        else {
            Request.vcCountryNameAndISO = '';
        }
    },

    removeDivsFromOtherSubtypes: function () {

        if (Request.vcDataModelCode != 'InvoiceIssued') {
            $("#InvoiceIssuedFields").remove();
        }
        if (Request.vcDataModelCode != 'InvoiceReceived') {
            $("#InvoiceReceivedFields").remove();
            $("#removablebIntrastat").remove();
        }
        if (Request.vcDataModelCode != 'Tax') {
            $("#TaxFields").remove();
        }
        if (Request.vcDataModelCode != 'PayrollSS') {
            $("#PayrollSSFields").remove();
        }
        if (Request.vcDataModelCode != 'GESPA') {
            $("#GESPAFields").remove();
        }
        if (Request.vcDataModelCode != 'PurchaseOrder') {
            $("#PurchaseOrderFields").remove();
            $("#PurchaseOrderSubTypeField").remove();
            $("#PurchaseOrderApprovalAreaField").remove();
        }
        if (Request.vcDataModelCode != 'StatutoryAccount') {
            $("#StatutoryAccountFields").remove();

        }
        //borrar uno a uno (los que no estan agrupados, no pueden ser agrupados por cuestiones estéticas)
        if (Request.vcDataModelCode == 'InvoiceIssued') {
            $("#removabledcAmount").remove();
            $("#removableintItemGroup").remove();
            $("#removablevcItem").remove();
            $("#removabledtAccrualDate").remove();
            $("#removablebPaymentRelease").remove();
        }
        if (Request.vcDataModelCode == 'InvoiceReceived') {
            //APV:Este es un caso especial, si que existe dcAmount en invoice recieved, pero oculto otro de otro para que no salga duplicado    
            $("#removabledcAmount").remove();
            $("#removabledtAccrualDate").remove();
        }
        if (Request.vcDataModelCode == 'PayrollSS') {

            $("#removabledcAmount").remove();
        }
        if (Request.vcDataModelCode == 'GESPA') {

            $("#removabledcAmount").remove();
        }
        if (Request.vcDataModelCode == 'Tax') {
            $("#removableintItemGroup").remove();
            $("#removablevcItem").remove();
            $("#removabledcAmount").remove();
        }
        if (Request.vcDataModelCode == 'PurchaseOrder') {
            $("#removableintItemGroup").remove();
            $("#removablevcItem").remove();
            $("#removabledtAccrualDate").remove();
            $("#removabledtDueDate").remove();
            $("#removabledtPaymentDate").remove();
            $("#removablevcIBAN").remove();
            $("#removablevcSWIFT").remove();
            $("#removableintPaymentMethod").remove();
            $("#removablebPaymentRelease").remove();
            $("#removablevcWindFarm").remove();
            $("#removabledcPaymentAmount").remove();
            $("#removablevcAccountIDCode").remove();
        }
        if (Request.vcDataModelCode == 'StatutoryAccount') {
            $("#removableintItemGroup").remove();
            $("#removablevcItem").remove();
            $("#removabledcAmount").remove();
            $("#removabledcPaymentAmount").remove();
            $("#removabledtAccrualDate").remove();
            $("#removabledtDueDate").remove();
            $("#removabledtPaymentDate").remove();
            $("#removablevcAccountIDCode").remove();
            $("#removablevcIBAN").remove();
            $("#removablevcSWIFT").remove();
            $("#removableintPaymentMethod").remove();
            $("#removablebPaymentRelease").remove();
            $("#removablevcWindFarm").remove();
            $("#removablevcReference").remove();
        }
        if (Request.vcDataModelCode != 'PurchaseOrder' &&
            Request.vcDataModelCode != 'InvoiceReceived') {
            $("#ThirdPartyCategoryField").remove();
            $("#ServiceTypeField").remove();
        }
    },

    removeDocumentActionGridColsFromOtherSubtypes: function () {
        var grid = $("#DocumentActionGrid").data("kendoGrid");
        if (Request.vcDataModelCode == 'InvoiceIssued') {
            grid.hideColumn("dcAmount");
            grid.hideColumn("dtAccrualDate");
            grid.hideColumn("bPaymentRelease");
            grid.hideColumn("intThirdPartyVatAccount_vcIBAN");
            grid.hideColumn("dtChangeVatPaymentToThirdPartyVatAccount");
        }
        if (Request.vcDataModelCode == 'InvoiceReceived') {
            grid.hideColumn("dtAccrualDate");
        }
        if (Request.vcDataModelCode == 'PayrollSS') {
            grid.hideColumn("dcAmount");
            grid.hideColumn("intThirdPartyVatAccount_vcIBAN");
            grid.hideColumn("dtChangeVatPaymentToThirdPartyVatAccount");
        }
        if (Request.vcDataModelCode == 'GESPA') {
            grid.hideColumn("dcAmount");
            grid.hideColumn("intThirdPartyVatAccount_vcIBAN");
            grid.hideColumn("dtChangeVatPaymentToThirdPartyVatAccount");
        }
        if (Request.vcDataModelCode == 'Tax') {
            grid.hideColumn("dcAmount");
            grid.hideColumn("intThirdPartyVatAccount_vcIBAN");
            grid.hideColumn("dtChangeVatPaymentToThirdPartyVatAccount");
        }
        if (Request.vcDataModelCode == 'PurchaseOrder') {
            grid.hideColumn("dtAccrualDate");
            grid.hideColumn("intThirdPartyAccount_vcIBAN");
            grid.hideColumn("intPaymentMethod_vcName");
            grid.hideColumn("bPaymentRelease");
            grid.hideColumn("dcPaymentAmount");
            grid.hideColumn("intThirdPartyVatAccount_vcIBAN");
            grid.hideColumn("dtChangeVatPaymentToThirdPartyVatAccount");
        }
        if (Request.vcDataModelCode == 'StatutoryAccount') {
            grid.hideColumn("dcAmount");
            grid.hideColumn("dcPaymentAmount");
            grid.hideColumn("dtAccrualDate");
            grid.hideColumn("intThirdPartyAccount_vcIBAN");
            grid.hideColumn("intPaymentMethod_vcName");
            grid.hideColumn("bPaymentRelease");
            grid.hideColumn("intThirdPartyVatAccount_vcIBAN");
            grid.hideColumn("dtChangeVatPaymentToThirdPartyVatAccount");
        }
    },
    configRequiredProperties: [],
    blRequiredProperties: [],
    blNotRequiredProperties: [],
    setBLRequiredProperties: function (properties, value) {
        properties.forEach((property) => {
            this.setBLRequiredProperty(property, value);
        });
    },
    setBLRequiredProperty: function (property, value) {
        if (value && this.blRequiredProperties.indexOf(property) === -1) {
            this.blRequiredProperties.push(property);
            this.setRequiredProperty(property, value);
        }
        else if (!value && this.blRequiredProperties.indexOf(property) !== -1) {
            this.blRequiredProperties.splice(this.blRequiredProperties.indexOf(property), 1);
            this.setRequiredProperty(property, value);
        }

        if (this.configRequiredProperties.indexOf(property) === -1) {
            this.setRequiredProperty(property, value);
        }
    },
    setRequiredProperty: function (property, value) {
        var newValue = false;
        if (value != null) {
            newValue = value === true;
        }
        $('#' + encodeURI(property)).attr('required', hySanitizeBool(newValue));
    },
    configNoEditableProperties: [],
    blNoEditableProperties: [],
    setBLEditableProperty: function (property, value) {
        if (!value && this.blNoEditableProperties.indexOf(property) === -1) {
            this.blNoEditableProperties.push(property);
        }
        else if (value && this.blNoEditableProperties.indexOf(property) !== -1) {
            this.blNoEditableProperties.splice(this.blNoEditableProperties.indexOf(property), 1);
        }

        if (this.configNoEditableProperties.indexOf(property) === -1) {
            this.setEditableProperty(property, value);
        }
    },
    setEditableProperty: function (property, value) {
        var sanitizedProperty = hySanitize(property);
        if (sanitizedProperty === 'intDocumentTypeStatusID') {
            sanitizedProperty = 'intDocumentTypeStatusIDBtn'
        }
        $('#' + sanitizedProperty).each((index, item) => {
            if ($(item).hasClass("toggle")) {
                if (value) {
                    $(item).removeClass('disabled');
                }
                else {
                    $(item).addClass('disabled');
                }
            }
            else if ($(item).data()) {
                var widget = $(item).data();
                if (widget.kendoButton) {
                    widget.kendoButton.enable(value);
                }
                else if (widget.kendohyDropDownList) {
                    widget.kendohyDropDownList.enable(value);
                }
                else if (widget.kendoNumericTextBox) {
                    widget.kendoNumericTextBox.enable(value);
                }
                else if (widget.kendoDatePicker) {
                    widget.kendoDatePicker.enable(value);
                }
                else if ($(item).is('input') || $(item).is('textarea')) {
                    var newValue = !(value === true);
                    $(item).attr('readonly', hySanitizeBool(newValue));
                }
                else {
                    console.log("TODO");
                }
            }
            else {
                console.log("TODO");
            }
        });
    },
    bindDatamodelWhithRequireds: function () {
        // el problema son los combos, que no bindean el required
        var fieldsRequireds = []
        if (Request.vcDataModelCode == 'InvoiceIssued') {
            fieldsRequireds = ["vcReference", "intDocumentTypeID", "intDocumentTypeStatusID", "intFirmID", "vcCustomer", "vcUser", "vcApprovalBy", "dtInvoiceDate", "dcPaymentAmount", "intCurrencyID", "dtDueDate"];
        }
        if (Request.vcDataModelCode == 'InvoiceReceived') {
            fieldsRequireds = ["vcReference", "intDocumentTypeID", "intDocumentTypeStatusID", "intFirmID", "intThirdPartyID", "dtInvoiceDate", "bIsResident", "bNeedResidenceCertificate", "dcAmount", "vcCurrentCertificate", "dcPaymentAmount", "intCurrencyID", "dtDueDate", "intPaymentMethodID"];
        }
        if (Request.vcDataModelCode == 'Tax') {
            fieldsRequireds = ["vcReference", "intDocumentTypeID", "intDocumentTypeStatusID", "intFirmID", "intThirdPartyID", "dcPaymentAmount", "intCurrencyID", "dtAccrualDate", "dtDueDate", "intPaymentMethodID", "intTaxTypeID"];
        }
        if (Request.vcDataModelCode == 'PayrollSS') {
            fieldsRequireds = ["vcReference", "intDocumentTypeID", "intDocumentTypeStatusID", "intFirmID", "intThirdPartyID", "dcPaymentAmount", "intCurrencyID", "dtAccrualDate", "dtDueDate", "intPaymentMethodID"];
        }
        if (Request.vcDataModelCode == 'GESPA') {
            fieldsRequireds = ["vcReference", "intDocumentTypeID", "intDocumentTypeStatusID", "intFirmID", "intThirdPartyID", "dcPaymentAmount", "intCurrencyID", "dtAccrualDate", "dtDueDate", "intPaymentMethodID"];
        }
        if (Request.vcDataModelCode == 'PurchaseOrder') {
            fieldsRequireds = ["vcReference", "intDocumentTypeID", "intDocumentTypeStatusID", "intFirmID", "intThirdPartyID", "vcTitle", "vcRequisitioner", "vcPurchaseOrderNumber", "dtPurchaseOrderDate", "intPurchaseOrderTypeID", "dcAmount", "intCurrencyID", "intPurchasingTypeID", "vcReview"];
        }
        if (Request.vcDataModelCode == 'StatutoryAccount') {
            fieldsRequireds = ["intDocumentTypeID", "intDocumentTypeStatusID", "intFirmID", "vcTitle", "intCurrencyID"];
        }
        Request.setBLRequiredProperties(fieldsRequireds, true);
        kendo.bind($("#intDocumentType_intDocumentTypeDataModel_vcName"), Request);
    },
    setDataModel: function (vcDataModelCode) {
        Request.vcDataModelCode = vcDataModelCode;
        if (vcDataModelCode !== null) {
            Request.entityModel = App.getEntityModel(Request.vcDataModelCode, true);
            Request.entityFields = Request.entityModel.fields;
            Request.intDocumentType_intDocumentTypeDataModel_vcName = Request.vcDataModelCode;
            Request.removeDivsFromOtherSubtypes();
            Request.removeDocumentActionGridColsFromOtherSubtypes();
            Request.bindDatamodelWhithRequireds();
        }
        else {
            Request.entityModel = null;
            Request.entityFields = {};
            Request.intDocumentType_intDocumentTypeDataModel_vcName = null;
            Request.set("documentTypeNotificationEnabled", false);
        }
        Request.refreshDocumentTypeDataModelConfig(vcDataModelCode);
    },
    refreshDocumentTypeDataModelConfig(vcDataModelCode) {
        this.set("documentTypeNotificationEnabled", false);
        if (vcDataModelCode) {
            var documentTypeDataModelSource = new hyDataSourceOdata({
                hyEntityName: "DocumentTypeDataModel",
                hyFilter: "vcCode eq '" + vcDataModelCode + "'"
            });
            documentTypeDataModelSource.read().then((result) => {
                if (documentTypeDataModelSource.data().length == 1) {
                    this.set("documentTypeNotificationEnabled", documentTypeDataModelSource.data()[0].bNotificationsEnabled);
                }
            });
        }
    },
    getHasField: function (fieldName) {
        var result = (Request.entityModel !== null && typeof (Request.entityModel.fields[fieldName]) !== "undefined");
        return result;
    },
    refreshFirmCombos: function (Request) {
        kendo.bind($("#vcFirmSPA"), Request); // para actualizar el SAP Code       
        kendo.bind($("#vcCountryNameAndISO"), Request); // para actualizar el país
        kendo.bind($("#intThirdParty_vcCode"), Request); // para actualizar el ThirdParty Code
        kendo.bind($("#intThirdPartyCategoryID"), Request); //actualizar el third party category
        kendo.bind($("#divDocumentType"), Request); //actualizar el combo de doctype
    },
    clearForFirmCombos: function (Request, bIsComboFirm, bIsComboDocumentType, bIsComboThirdParty) {
        if (bIsComboFirm) {
            Request.set("currentRecord.intFirmID", null);
        }
        if (bIsComboDocumentType) {
            Request.set("currentRecord.intDocumentTypeID", null);
            Request.currentRecordDocTypeStatus.set("ID", null);
            Request.currentRecordDocTypeStatus.set("vcName", null);
            Request.currentRecordDocType.set("ID", null);
            Request.currentRecordDocType.set("vcName", null);
        }
        if (bIsComboThirdParty) {
            Request.set("currentRecord.intThirdPartyID", null);
            Request.set("currentRecord.intThirdParty_vcCode", "");
            Request.set("currentRecord.intThirdPartyCategoryID", null);
        }
        Request.refreshFirmCombos(Request);
    },
    evtCloseComboFirm: function (e) {
        var dataItem = e.sender.dataItem();

        if (dataItem.ID == "") return;

        Request.currentRecord.intFirm_intCountryID = dataItem.intCountryID;
        Request.set("currentRecord.intFirm_vcSAPCode", dataItem.vcSAPCode);

        Request.setThirdParyFilterFromFirm(false);
        Request.setCountry(dataItem.intCountry_vcName, dataItem.intCountry_chISOCode2);

        Request.set("currentRecord.intCecoID", null);
        Request.setCecoFilter(dataItem.intCountry_vcName);

        Request.setOriginNotificationFilterFromFirm();

        this.refreshDsPurchaseOrders();

        var idFirmSelected = dataItem.ID;
        if (!idFirmSelected || idFirmSelected == "") {
            Request.clearForFirmCombos(Request, true, true, true);
            return;
        }
        Request.filterDocTypeFromCompany = "DocumentTypeFirms/any(f:f/intFirmID eq " + idFirmSelected + " and f/dtDeactivateDate eq null)";
        Request.setDocumentTypeFilter();
        Request.dsDocumentType.read().then(function () {
            Request.clearForFirmCombos(Request, false, true, false);
        });
    },
    refreshDsPurchaseOrders: function () {
        var currentPOFilter = "intDocumentType/intDocumentTypeDataModel/vcCode eq 'PurchaseOrder' and " +
            "(intDocumentTypeStatus/bShowInPaymentList eq true)"; //solo los aprobados de tipo base según flujo

        var intCountryID = Request.currentRecord.intFirm_intCountryID ? Request.currentRecord.intFirm_intCountryID : 0;
        Request.dsPurchaseOrders.setURLFilter(currentPOFilter + ' and intFirm/intCountryID eq ' + intCountryID, true);
    },
    evCloseComboThirdParty: function (e) {
        var dataItem = e.sender.dataItem();
        if (dataItem && dataItem.ID != "") {
            Request.setThirdPartyAccountFilter(dataItem.ID);
            //Request.setIBANFromThirdParty(dataItem.vcIBAN);
            //Request.setSWIFTFromThirdParty(dataItem.vcSWIFT);
            Request.setCurrencyFromThirdParty(dataItem.intCurrencyID);
            Request.setPaymentMethodFromThirdParty(dataItem.intPaymentMethodID);
        }
        Request.set("currentRecord.intThirdParty_vcCode", dataItem.vcCode);
        kendo.bind($("#intThirdParty_vcCode"), Request); // para actualizar el ThirdParty Code

        Request.set("currentRecord.intThirdPartyCategoryID", dataItem.intThirdPartyCategoryID);
        kendo.bind($("#intThirdPartyCategoryID"), Request);
    },
    evCloseComboThirdPartyAccount: function (e) {
        let vcSwift = null;
        var dataItem = e.sender.dataItem();
        if (dataItem && dataItem.ID != "") {
            vcSwift = dataItem.vcSWIFT;
        }
        Request.setSWIFTFromThirdPartyAccount(vcSwift);

    },
    evCloseComboPaymentMethod: function (e) {
        var recordDD = e.sender.dataItem();
        //the invoice issued do no need a Third Party
        if (Request.vcDataModelCode != "InvoiceIssued") {
            Request.setBLRequiredProperty("intThirdPartyAccountID", recordDD.bRequiresThirdPartyAccount);
        }
    },

    evtDocumentTypeOnCascade: function (e) {

        var recordDD = e.sender.dataItem()
        var ID = recordDD.ID;
        if (ID == "") {
            ID = null;
            recordDD.bEditablePurchaseOrder = false;
        }

        Request.currentRecord.intDocumentTypeStatusID = 0;
        Request.currentRecordDocTypeStatus.set("ID", null);
        Request.currentRecordDocTypeStatus.set("vcName", null);


        Request.currentRecord.intDocumentTypeID = ID;

        Request.getNextStatus(Request.currentRecord.intFirmID, Request.currentRecord.intDocumentTypeID, Request.currentRecord.intDocumentTypeStatusID, Request.currentRecord.intDocumentSubTypeID);
        Request.getPurchaseApprovedByControlID();

        RequestSubType.setStatusFilter();
        Request.set("withPO", recordDD.bEditablePurchaseOrder);
        if (!Request.withPO) {
            Request.set("currentRecord.intPurchaseOrderID", 0);
        }

        kendo.bind($("#divDocumentTypeStatus"), Request);
        kendo.bind($("#intPurchaseOrderID"), Request);
    },
    currentRecordDocTypeStatus: { ID: null, vcName: null },
    currentRecordDocType: { ID: null, vcName: null },
    evtOpenStatusDialog: function () {
        var titlemsg = "Select document type status";

        var currentStatusID = Request.currentRecord.intDocumentTypeStatusID;
        if (!currentStatusID)
            currentStatusID = 0;
        var documentSubType = Request.getByID(Request.dsDocumentSubType, Request.intDocumentSubType);
        this.dsDocumentTypeStatus.setURLFilter("intDocumentTypeID eq " + Request.currentRecord.intDocumentTypeID + " and intDocumentSubTypeID eq " + Request.intDocumentSubType);

        if (documentSubType)
            titlemsg = "Select document type status " + documentSubType.vcName;

        var strmessage = `
        <div class="row" id="dlgDocTypeStatus">
                <div class="col-xs-12">
                    <div class="form-group">
                        <ul id="lstDocTypeStatus"
                             style="border:none;list-style-type: none; box-shadow: none;"
                             class="list-group"
                             data-role="listview"
                             data-bind="source: dsDocumentTypeStatus"
                             data-auto-bind="true"
                             data-selectable="true"
                             data-pageable="false"
                             data-sortable="false"
                             data-template="lstDocTypeStatusTemplate"
                             data-scrollable="true">
                        </ul>
                    </div>
                </div>
            </div>

            <script type="text/kendo-x-tmpl" id="lstDocTypeStatusTemplate">
                    #var active = '' #
                    #if ([[nextStatus]].includes(ID)) {#
                        #if (ID == [currentSelected]) {#
                            #active=' <span class="fa fa-check"></span>';#
                        #}#
                        <li style="width:95%; text-align: left;" class ="k-link list-group-item">#: vcName##= active#</li>
                    #}#

            </script>
            `;


        let body = strmessage.replaceAll('[currentSelected]', currentStatusID).replaceAll('\n', '');
        body = body.replaceAll('[nextStatus]', Request.nextStatus).replaceAll('\n', '');
        bootbox.dialog({
            title: titlemsg,
            message: body,
            buttons: {
                cancel: {
                    label: '<span class="fa fa-reply"></span> Cancel',
                    className: "k-button"
                },
                save: {
                    label: '<span class="fa fa-check"></span> Select',
                    className: "k-button k-primary",
                    callback: function () {
                        var lstStatus = $("#lstDocTypeStatus").getKendoListView();
                        var selectedItem = lstStatus.select();
                        if (!selectedItem.length > 0) {
                            return false;
                        }
                        var selectedtext = lstStatus.select()[0].innerText;
                        var dataSource = lstStatus.dataSource.view();
                        var selectedFiltered = dataSource.filter(a => a.vcName == selectedtext);
                        if (selectedFiltered.length > 0) {
                            var selected = selectedFiltered[0];
                            Request.set("currentRecord.intDocumentTypeStatusID", selected.ID);
                            Request.set("currentRecord.intDocumentTypeStatus_ID", selected.ID);
                            Request.currentRecord.intDocumentTypeStatus_vcName = selected.vcName;
                            Request.currentRecordDocTypeStatus.set("ID", selected.ID);
                            Request.currentRecordDocTypeStatus.set("vcName", selected.vcName);
                        }
                    }
                },
            }
        });

        kendo.bind($("#dlgDocTypeStatus"), Request);
    },
    getNextStatus: function (intFirmId, docType, currentStatus, docSubType) {
        hyKendo.ajax({
            type: 'POST',
            contentType: "application/json; charset=utf-8",
            url: ROOT_URL + 'odata/Documents/getNextStatus',
            data: kendo.stringify({ intFirmId: intFirmId, docTypeId: docType, docTypeStatusId: currentStatus, docSubTypeID: docSubType == undefined ? null : docSubType }),
            datatype: "json",
            async: true,
            beforeSend: function beforesend(xmlhttprequest) {
                xmlhttprequest.setRequestHeader("accept", "application/json");
            },
            success: function success(status) {
                $.unblockUI();
                if (status.value) {
                    status.value.push(currentStatus);
                    Request.nextStatus = status.value;
                    if (Request.vcDataModelCode == 'PurchaseOrder')
                        Request.getPurchaseApprovalAreaByPerson();
                }
            }
        });
    },

    saveFirmHead: function (e) {
        e.preventDefault();
        if ($.isNumeric(FirmHead.currentRecord.id) === false) {
            FirmHead.dataSource.add(FirmHead.currentRecord);
        }
        this.dataSource.sync();
    },
    setValueToRadioButtons: function () {
        //Para los radio buttons
        Request.set("vcResident", Request.currentRecord.bIsResident ? "true" : "false");
        Request.settingNeedCertificateResidenceInitialValue = true;
        Request.set("vcNeedCertificateResidence", Request.currentRecord.bNeedResidenceCertificate ? "true" : "false");
        Request.settingNeedCertificateResidenceInitialValue = false;
        Request.set("vcReview", Request.currentRecord.vcReview ? (Request.currentRecord.vcReview == "true" ? "true" : "false") : "false");
    },
    fetchRequest: function (viewID) {
        var filterID = parseInt(viewID == null ? "-1" : viewID);
        this.dsDocumentAction.setURLFilter("intDocumentID eq " + filterID);
        this.dsDocumentAttachment.setURLFilter("intDocumentID eq " + filterID + " and intAttachment/any (o: o/dtDeactivateDate eq null)");
        this.dsTalk.setURLFilter("intDocumentID eq " + filterID);
        this.dsNotification.setURLFilter("intDocumentID eq " + filterID);

        // todo: hay que cambiar el filtro de Status para seguridad (no está aplicando derecho full) y por el subtipo que toque (disabled hasta seleccionar)
        // hyFilter: "intTeamDocumentTypeStatus/any (t: t/dtDeactivateDate eq null and t/intTeam/intTeamPerson/any (tp: tp/dtDeactivateDate eq null and tp/intPersonID eq " + userBean.intID + "))",
        if (viewID !== null) {
            this.set("allowSelectOriginNotification", false);
            this.set("allowAddOriginNotification", false);
            this.dataSource.fetch(function () {
                //this.hySelectFirstRecord(); no quiero que aún bindee
                Request.set("currentRecord", Request.dataSource.at(0));
                RequestSubType.setDocumentSubType();
                RequestSubType.setDocumentSubTypeCode();
                Request.dsPurchaseOrderApprovalArea.fetch();
                Request.dsPurchaseOrderType.fetch();
                Request.dsPurchasingType.fetch();
                Request.dsThirdPartyCategory.fetch();
                Request.dsServiceType.fetch();
                Request.dsDocumentType.fetch().then(function () {
                    Request.getPurchaseApprovedByControlID();
                }); // para tener ya el nombre del modelo

                Request.dsDocumentSubType.fetch().then(function () {
                    Promise.all([Request.setPurchasingCode(), Request.setPOTypeCode()]).then(() => {
                        RequestSubType.togglePurchasingTypeField();
                        RequestSubType.togglePOTypeField();
                        RequestSubType.bindRequiredsIfNotOldRequest();
                    });
                });

                RequestSubType.setServiceTypeOptionLabel();
                Request.getNextStatus(Request.currentRecord.intFirmID, Request.currentRecord.intDocumentTypeID, Request.currentRecord.intDocumentTypeStatusID, Request.currentRecord.intDocumentSubTypeID);

                Request.dsDocumentTypeStatus.fetch().then(function () {
                    RequestSubType.refreshPurchaseEditableFields();
                });

                Request.refreshAssignedTo();
                Request.initRequest();//Se tiene que llamar despues de que haya cargado el record para que el switch pueda ser true 
                RequestSubType.setStatusFilter();
                Request.set("hasRequestLoaded", true);
                Request.setValueToRadioButtons();
                Request.evtClearAssignedTo();
                Request.dsCeco.fetch();

                //No podemos actualizar el input si está bindeado al Request.currentRecord.intDocumentTypeStatus pq el vcName es no editable 
                //y no acaba de mostrarse incluso si lo declaramos como editable en el dbmodel.
                Request.currentRecordDocTypeStatus.set("ID", Request.currentRecord.intDocumentTypeStatusID);
                Request.currentRecordDocTypeStatus.set("vcName", Request.currentRecord.intDocumentTypeStatus_vcName);
                Request.currentRecordDocType.set("ID", Request.currentRecord.intDocumentTypeID);
                Request.currentRecordDocType.set("vcName", Request.currentRecord.intDocumentType_vcName);
                Request.hyBindContents();
            });
        }
        else {
            this.set("allowSelectOriginNotification", true);
            this.set("allowAddOriginNotification", (userBean.canHandleNotification && hasDataRightModified("Notification") && hasDataRightAdded("Notification") && hasDataRightDeleted("Notification")));
            // hay que averiguar el tipo para poner el modelo del schema adecuado
            var schemaModelName = "tblDocument" + Request.vcDataModelCode;
            this.dataSource.options.schema.model = Request.entityModel;
            this.dataSource.hyNewRecord();

            Request.initRequest();
            Request.set("hasRequestLoaded", false);
            Request.hyBindContents();
            Request.dsDocumentType.fetch(); // para tener ya el nombre del modelo
            Request.dsPurchaseOrderType.fetch();
            Request.dsPurchasingType.fetch();
            Request.dsThirdPartyCategory.fetch();
            Request.dsServiceType.fetch();
            RequestSubType.setServiceTypeOptionLabel();
            Request.dsPurchaseOrderApprovalArea.fetch();
            Request.dsCeco.fetch();
            Request.dsDocumentSubType.fetch().then(function () {
                RequestSubType.bindRequiredsIfNotOldRequest();
            });
            Request.dsDocumentAttachment.fetch();
            Request.dsTalk.fetch();
            Request.dsNotification.fetch();
            Request.dsLoS.setURLFilter("vcCode eq '" + Request.vcLoSCode + "'");
            Request.dsLoS.fetch(function () {
                var row = this.at(0);
                if (row != null) Request.set("lblLoS", row.vcName);
            });
            //2016.05.05 APV: Limpiar datepickers
            $(".k-datepicker input").val(null)

            //LLenar entry date
            Request.set("lblEntryDate", kendo.toString(kendo.parseDate(new Date()), 'dd/MM/yyyy'));
            RequestSubType.removeField(".ceco-view-field");
            RequestSubType.removeField(".purchasingType-view-field");
            RequestSubType.removeField(".poType-view-field");
        }

        Request.dsAttachmentType.fetch();
    },
    refreshAssignedTo() {
        if (this.currentRecord && this.currentRecord.intDocumentTypeID) {
            Request.dsAssignedTo.options.hyReadParameters.intDocumentTypeID = this.currentRecord.intDocumentTypeID;
        }
        else {
            Request.dsAssignedTo.options.hyReadParameters.intDocumentTypeID = -1;
        }
        Request.dsAssignedTo.read();
    },
    onViewLoad: function () {
        var fragment = URI(window.location).hash();
        var numparts = fragment.split('/').length;
        var viewID;
        if (numparts > 2) {
            viewID = null;
            Request.vcLoSCode = hyAppRouter.getViewID(1, false);
            Request.setDataModel(hyAppRouter.getViewID(2, false));
        }
        else {
            viewID = hyAppRouter.getViewID();
            Request.vcLoSCode = null;
            Request.setDataModel(null);
        }
        Request.fetchRequest(viewID);
    },

    createUpload: function () {
        Request.docsUpload = new hyUpload({
            className: "RequestFiles",
            removePath: 'File/removeFile?intAttachmentBridgeID=',//'DocumentAttachmentMvc/removeFile?intAttachmentBridgeID=',
            onremove: function () {
                Request.dsDocumentAttachment.fetch();
                // por que haces un fetch del dataSource y no del documentAttachment
                Request.dataSource.fetch(function () {
                    Request.hyBindContents();
                });
            }
        });
        var $inputs = Request.docsUpload.getContainersFileUpload();
        var $kUpload = $inputs.getKendoUpload();
        if (!$kUpload) {
            $kUpload = $inputs.kendoUpload({
                multiple: true,
                async: {
                    saveUrl: ROOT_URL + 'api/Upload',
                    autoUpload: true
                },
                localization: {
                    select: 'Select a file...'
                },
                success: function (e) {
                    if (Request.docsUpload.filesArray !== "")
                        Request.docsUpload.filesArray += ",";
                    var response = $.parseJSON(e.response);
                    Request.docsUpload.filesArray += (response.ID);
                }
            })
        }
    },
    clearDescription: function () {
        $("#vcRemarks").val("");
    },
    initRequest: function (e) {
        //Hay que crearlo al principio para que puedas descargar adjuntos sin crear el dialogo
        Request.createUpload();
        //Limipar el campo descipcion
        Request.clearDescription();
        Request.setLoSFilters();
        //Init Filter of Thirdparty combo
        Request.setThirdParyFilterFromFirm(true);
        //Init Filter of OriginNotification combo
        Request.setOriginNotificationFilterFromFirm();

        //switches
        $('#bIsIncident').toggles({ text: { on: 'Yes', off: 'No' }, toggleRecord: "bIsIncident", height: 30 })
            .on('click', function (e, active) {
                Request.evtClearAssignedTo();
                kendo.bind($("#intIncidentAssignedToID"), Request); //bindeo parcial porque esta pantalla lo requiere (caso raro)
            });
        $('#bTaxAnalysisCompleted').toggles({ text: { on: 'Yes', off: 'No' }, toggleRecord: "bTaxAnalysisCompleted", height: 30 });
        $('#bPaymentRelease').toggles({ text: { on: 'Yes', off: 'No' }, toggleRecord: "bPaymentRelease", height: 30 });
        $('#bIsConsumed').toggles({ text: { on: 'Yes', off: 'No' }, toggleRecord: "bIsConsumed", height: 30 });
        $('#bIntrastat').toggles({ text: { on: 'Yes', off: 'No' }, toggleRecord: "bIntrastat", height: 30 });
        $('#bIsChargeableToBudget').toggles({ text: { on: 'Yes', off: 'No' }, toggleRecord: "bIsChargeableToBudget", height: 30 });
        if (!hasProgramRight('canModifyPaymentRelease')) { //si no tengo el derecho el toggle esta bloqueado (tambien se mira en servidor)
            Request.setBLEditableProperty("bPaymentRelease", false);
        }

        Request.setDataModelFilters();
    },
    evtClearAssignedTo: function () {
        if (!Request.currentRecord.bIsIncident) {
            Request.set("currentRecord.intIncidentAssignedToID", 0);
            Request.set("currentRecord.intIncidentAssignedToID", 0);
            Request.set("currentRecord.intIncidentAssignedTo_ID", 0);
            Request.set("currentRecord.intIncidentAssignedTo_vcName", null);
            Request.setBLRequiredProperty("intIncidentAssignedToID", false);
        } else {
            if (Request.currentRecord.intIncidentAssignedToID === null || Request.currentRecord.intIncidentAssignedToID == 0) {
                Request.setBLRequiredProperty("intIncidentAssignedToID", true);
            }
        }
    },
    saveDocumentAttachment: function (rowdata, attachmentTypeID, vcName, vcDescription) {
        //hyAppRouter.getCurrentViewModel().currentRecord;
        var data = null;
        var urltocall = ROOT_URL + "UploadAction/createDocumentAttachmentDocs";
        data = {};
        data.documentID = hyAppRouter.getCurrentViewModel().currentRecord.ID;
        data.AttachmentTypeID = parseInt(attachmentTypeID);
        data.vcName = vcName;
        data.vcDescription = vcDescription;
        data.filesArray = Request.docsUpload.filesArray;
        hyKendo.ajax({
            type: 'POST',
            contentType: "application/json; charset=utf-8",
            url: urltocall,
            data: kendo.stringify(data),
            datatype: "json",
            async: true,
            beforeSend: function (XMLHttpRequest) {
                XMLHttpRequest.setRequestHeader("Accept", "application/json");
                XMLHttpRequest.setRequestHeader("RequestVerificationToken", antiForgeryToken);
            },
            success: function (status) {
                $.unblockUI();
                if (status.Success) {
                    Request.dsDocumentAttachment.fetch();
                }
                else {
                    var msg = "Attachment not saved.";
                    if (typeof status.Message !== 'undefined') {
                        msg += "<br />" + status.Message;
                    }
                    hyBootstrapHelper.warning(msg);
                }
            }
        });
    },
    saveTalkRow: function (vcName) {
        //hyAppRouter.getCurrentViewModel().currentRecord;
        var data = null;
        var urltocall = ROOT_URL + "ChatAction/createTalkRow";
        data = {};
        data.documentID = hyAppRouter.getCurrentViewModel().currentRecord.ID;
        data.vcName = vcName;
        hyKendo.ajax({
            type: 'POST',
            contentType: "application/json; charset=utf-8",
            url: urltocall,
            data: kendo.stringify(data),
            datatype: "json",
            async: true,
            beforeSend: function (request) {
                request.setRequestHeader("accept", "application/json");
                request.setRequestHeader("RequestVerificationToken", antiForgeryToken);
            },
            success: function (status) {
                $.unblockUI();
                if (status.Success) {
                    Request.dsTalk.fetch();
                }
                else {
                    var msg = "Comment not saved.";
                    if (typeof status.Message !== 'undefined') {
                        msg += "<br />" + status.Message;
                    }
                    hyBootstrapHelper.warning(msg);
                }
            }
        });

    },
    showAttachmentDialog: function (e) {
        var rowdata = e.data;
        var isExpenseAdjust = false;
        var titlemsg = "Upload";
        var strmessage = `  
        <div class="row" id="attachmentDialog">
                <div class="col-xs-12">
                    <div class="form-group">
                        <label for="intAttachmentType" class="control-label">Attachment Type </label>
                        <input id="intAttachmentType"    class="form-control" />
                    </div>
                </div>
                <div class="col-xs-12">
                    <div class="form-group">
                        <label for="attachmentDialogUploadvcName" class="control-label">Name</label>
                        <input id="attachmentDialogUploadvcName" name="attachmentDialogUploadvcName" type="text" class="form-control" required />
                    </div>
                </div>

                <div class="col-xs-12">
                    <div class='divTextAreaRequiredPosition'>
                        <div class="form-group">
                            <label for="attachmentDialogUploadvcDescription" class ="control-label">Description</label>
                            <textarea id="attachmentDialogUploadvcDescription" name="attachmentDialogUploadvcDescription" class ="form-control" rows="5" required></textarea>
                        </div>
                    </div>
                </div>
               
                <div class="col-xs-12">
                    <div class ="form-group">
                        <input class ="form-control RequestFiles" type="file" id="files" name="files" fileRequired/>
                    </div>
                </div>
                <div class ="col-xs-12">
                    <div class ="form-group">
                        <span class ="k-invalid-msg" data-for="files"></span>
                    </div>
                </div>
            </div>
            <script>Request.setAdjTypeComboToDialog()</script>
            `;

        bootbox.dialog({
            title: titlemsg,
            message: strmessage.replaceAll('\n', ''),
            buttons: {
                save: {
                    label: "Save",
                    className: "k-button k-primary",
                    callback: function () {
                        //Guardar el ajuste
                        var $frmToValidate = $("#attachmentDialog");
                        if (createKendoValidator($frmToValidate).validate()) {
                            Request.saveDocumentAttachment(rowdata, $('#intAttachmentType').data("kendoDropDownList").value(), $("#attachmentDialogUploadvcName").val(), $("#attachmentDialogUploadvcDescription").val());
                        }
                        else {
                            return false;
                        } // para que no se cierre el dialogo
                    }
                },
                cancel: {
                    label: "Cancel",
                    className: "k-button"
                }
            }
        });
        Request.createUpload();
    },
    showChatDialog: function (e) {
        var rowdata = e.data;
        var isExpenseAdjust = false;
        var titlemsg = "Insert comment";
        var strmessage = `
            <form id="frmChatDialog">
            <div class="row" id="chatDialog">
                <div class="col-xs-12">
                    <div class='divTextAreaRequiredPosition'>
                        <div class="form-group">
                            <textarea id="chatDialogvcName" name="chatDialogvcName" class ="form-control" rows="5" required></textarea>
                        </div>
                    </div>
                </div>
            </div>
            </form>
            `;

        bootbox.dialog({
            title: titlemsg,
            message: strmessage.replaceAll('\n', ''),
            buttons: {
                cancel: {
                    label: '<span class="fa fa-reply"></span> Cancel',
                    className: "k-button"
                },
                save: {
                    label: '<span class="fa fa-pencil"></span> Add comment',
                    className: "k-button k-primary",
                    callback: function () {
                        //Guardar el ajuste
                        var $frmToValidate = $("#frmChatDialog");
                        var validator = createKendoValidator($frmToValidate);
                        if (validator.validate()) {
                            Request.saveTalkRow($("#chatDialogvcName").val());
                        }
                        else {
                            return false;
                        } // para que no se cierre el dialogo
                    }
                }
            }
        });
    },
    showNotificationDialog() {
        getComponent(this.NotificationModule, 'component/DocumentSubmitionNotificationDialog').then((module) => {
            const cmp = new module.DocumentSubmitionNotificationDialog(Request.currentRecord.intFirmID);
            cmp.callback = function () { Request.dsNotification.fetch() };
            cmp.Render(Request.currentRecord.ID);
        });
    },
    showSubmitDialog(id) {
        getComponent(this.NotificationModule, 'component/SubmitionDialog').then((module) => {
            const cmp = new module.SubmitionDialog();
            cmp.callback = function () {
                Request.dsNotification.fetch();
                Request.dsDocumentAttachment.fetch();
            };
            cmp.Render(id);
        });
    },
    showSelectOriginNotification() {
        if (Request.currentRecord.intFirmID) {
            getComponent(this.NotificationModule, 'component/SelectOriginNotificationDialog').then((module) => {
                const cmp = new module.SelectOriginNotificationDialog(Request.currentRecord.intFirmID);
                cmp.callback = (id) => {
                    this.setOriginNotificationID(id);
                };
                cmp.Render();
            });
        }
    },
    showAddOriginNotification() {
        if (Request.currentRecord.intFirmID) {
            getComponent(this.NotificationModule, 'component/GeneralPurposeNotificationDialog').then((module) => {
                const cmp = new module.GeneralPurposeNotificationDialog(Request.currentRecord.intFirmID);
                cmp.callback = (id) => {
                    this.setOriginNotificationID(id);
                };
                cmp.Render();
            });
        }
    },
    setOriginNotificationID(value) {
        this.settingOriginNotificationID = true;
        if (value) {
            Request.currentRecord.intNotificationID = value;
            Request.set("originNotificationID", value);
            var notificationsSource = new hyDataSourceOdata({
                hyEntityName: "AllNotification",
                hyFilter: "ID eq " + value
            });
            notificationsSource.read().then((result) => {
                if (notificationsSource.data().length === 1) {
                    var originNotification = notificationsSource.data()[0];
                    originNotification.description = hyMoreInfo.getSplitTextWithHtmlEncode('chatSeparator', originNotification.ID, originNotification.vcDescription, 350);
                    originNotification.due = `Due Date: ${kendo.toString(originNotification.dtDue, ' dd/MM/yyyy')}`;
                    originNotification.notification = `Notification date: ${kendo.toString(originNotification.dtNotification, ' dd/MM/yyyy')}`;
                    Request.set("originNotification", originNotification);
                    var kendohyDropDownList = $("#originNotificationID").getKendohyDropDownList();
                    if (kendohyDropDownList.text() != originNotification.vcName) {
                        this.dsOriginNotification.add(originNotification);
                        kendohyDropDownList.text(originNotification.vcName)
                    }
                }
                else {
                    Request.set("originNotification", null);
                }
            });
        }
        else {
            Request.currentRecord.intNotificationID = null;
            Request.set("originNotificationID", null);
            Request.set("originNotification", null);
        }
        this.settingOriginNotificationID = false;
    },
    editNotification(id) {
        var notifications = Request.dsNotification.data();
        if (notifications.length > 0) {
            var notification = notifications.find((a) => { return a.ID == id });

            if (notification) {
                getComponent(this.NotificationModule, 'component/DocumentSubmitionNotificationDialog').then((module) => {
                    const cmp = new module.DocumentSubmitionNotificationDialog(Request.currentRecord.intFirmID);
                    cmp.callback = function () { Request.dsNotification.fetch() };
                    var dialog = cmp.Render(Request.currentRecord.ID);
                    cmp.FillForEdition(notification, dialog);
                });
            }
        }
    },
    uploadReset: function () {
        var $kUpload = $("input[type='file']").getKendoUpload();
        if ($kUpload && (typeof $kUpload.uploadReset) === 'function') {
            $kUpload.uploadReset();
        }
    },
    getUpdateReasonFromUser: function () {
        var titlemsg = "Change or update reason";
        var strmessage = "<div class='row' id='divUpdateReasonDialog'>" +
            "<div class='col-xs-12'>" +
            "<div class='divTextAreaRequiredPosition'>" +
            "<div class='form-group'>" +
            //"<textarea id='vcLastRemark' name='vcLastRemark' class='form-control' rows='5' required></textarea>" +
            "<textarea id='vcLastChangeOrUpdateReason' name='vcLastChangeOrUpdateReason' class='form-control' rows='5' required></textarea>" +
            "</div></div></div></div>";
        bootbox.dialog({
            title: titlemsg,
            message: strmessage.replaceAll('\n', ''),
            buttons: {
                cancel: {
                    label: '<span class="fa fa-reply"></span> Cancel',
                    className: "k-button"
                },
                save: {
                    label: '<span class="fa fa-pencil"></span> Add comment',
                    className: "k-button k-primary",
                    callback: function () {
                        //Guardar el ajuste
                        var $frmToValidate = $("#divUpdateReasonDialog");
                        if (createKendoValidator($frmToValidate).validate()) {
                            Request.set("currentRecord.vcLastChangeOrUpdateReason", $("#vcLastChangeOrUpdateReason").val());
                            Request.saveDocument(Request.currentRecord);
                        }
                        else {
                            return false;
                        } // para que no se cierre el dialogo
                    }
                }
            }
        });
    },
    evtSaveClick: function (e) {
        var $frmRequest = $("#formRequest");
        var formRequestValidate = createKendoValidator($frmRequest).validate();
        var $formRequestNotification = $("#formRequestNotification");
        var formRequestNotificationValidate = createKendoValidator($formRequestNotification).validate();
        if (formRequestValidate && formRequestNotificationValidate) {
            e.preventDefault();

            if (Request.vcDataModelCode == 'InvoiceReceived') {
                //Rellenamos la propiedad del currentRecord con los valores escogidos en los radiobuttons               
                Request.set("currentRecord.bIsResident", Request.vcResident);
                Request.set("currentRecord.bNeedResidenceCertificate", Request.vcNeedCertificateResidence);
            }
            else if (Request.vcDataModelCode == 'PurchaseOrder') {
                Request.set("currentRecord.vcReview", Request.vcReview);
            }

            //Controlar las fechas para que el formato siempre sea el "normal"... no el Date()....
            if (Request.vcDataModelCode == 'InvoiceReceived' || Request.vcDataModelCode == 'InvoiceIssued') {
                if (Request.currentRecord.dtInvoiceDate != null && Request.currentRecord.dtInvoiceDate.toString().indexOf("Date(") >= 0) {
                    var strdate = parseFloat(Request.currentRecord.dtInvoiceDate.replace("/", "").replace("Date(", "").replace(")", ""));
                    var jsd = new Date(strdate);
                    Request.set("currentRecord.dtInvoiceDate", jsd);
                }
            }
            if (Request.vcDataModelCode == 'InvoiceReceived' || Request.vcDataModelCode == 'InvoiceIssued' ||
                Request.vcDataModelCode == 'Tax' || Request.vcDataModelCode == 'PayrollSS' ||
                Request.vcDataModelCode == 'GESPA') {
                if (Request.currentRecord.dtPaymentDate != null && Request.currentRecord.dtPaymentDate.toString().indexOf("Date(") >= 0) {
                    var strdate = parseFloat(Request.currentRecord.dtPaymentDate.replace("/", "").replace("Date(", "").replace(")", ""));
                    var jsd = new Date(strdate);
                    Request.set("currentRecord.dtPaymentDate", jsd);
                }
                if (Request.currentRecord.dtDueDate != null && Request.currentRecord.dtDueDate.toString().indexOf("Date(") >= 0) {
                    var strdate = parseFloat(Request.currentRecord.dtDueDate.replace("/", "").replace("Date(", "").replace(")", ""));
                    var jsd = new Date(strdate);
                    Request.set("currentRecord.dtDueDate", jsd);
                }
            }
            if (Request.vcDataModelCode == 'Tax' || Request.vcDataModelCode == 'PayrollSS' ||
                Request.vcDataModelCode == 'GESPA') {
                if (Request.currentRecord.dtAccrualDate != null && Request.currentRecord.dtAccrualDate.toString().indexOf("Date(") >= 0) {
                    var strdate = parseFloat(Request.currentRecord.dtAccrualDate.replace("/", "").replace("Date(", "").replace(")", ""));
                    var jsd = new Date(strdate);
                    Request.set("currentRecord.dtAccrualDate", jsd);
                }
            }
            if (Request.vcDataModelCode == 'PurchaseOrder') {
                if (Request.currentRecord.dtPurchaseOrderDate != null && Request.currentRecord.dtPurchaseOrderDate.toString().indexOf("Date(") >= 0) {
                    var strdate = parseFloat(Request.currentRecord.dtPurchaseOrderDate.replace("/", "").replace("Date(", "").replace(")", ""));
                    var jsd = new Date(strdate);
                    Request.set("currentRecord.dtPurchaseOrderDate", jsd);
                }
                if (Request.currentRecord.dtValidFromDate != null && Request.currentRecord.dtValidFromDate.toString().indexOf("Date(") >= 0) {
                    var strdate = parseFloat(Request.currentRecord.dtValidFromDate.replace("/", "").replace("Date(", "").replace(")", ""));
                    var jsd = new Date(strdate);
                    Request.set("currentRecord.dtValidFromDate", jsd);
                }
                if (Request.currentRecord.dtValidityEndDate != null && Request.currentRecord.dtValidityEndDate.toString().indexOf("Date(") >= 0) {
                    var strdate = parseFloat(Request.currentRecord.dtValidityEndDate.replace("/", "").replace("Date(", "").replace(")", ""));
                    var jsd = new Date(strdate);
                    Request.set("currentRecord.dtValidityEndDate", jsd);
                }
            }

            if (Request.hasRequestLoaded) {
                //Si estamos editando, pedimos al usuario que introduzca un comentario en un campo de un dialogo
                Request.getUpdateReasonFromUser();
            }
            else Request.saveDocument(Request.currentRecord);
        }
    },
    cancel: function (e) {
        e.preventDefault();
        Request.currentRecord = null;
        //hyAppRouter.goToView("Home");
        //history.back();
        hyAppRouter.navigate("");
    },
    setAdjTypeComboToDialog: function () {
        $("#intAttachmentType").kendoDropDownList({
            dataTextField: "vcName",
            dataValueField: "ID",
            dataSource: Request.dsAttachmentType,
            index: 0
        });
    },

    saveDocument: function (record) {
        var urlAction = ROOT_URL + 'odata/Documents/createDocumentDocs'
        var jsonParamsToSend = {};
        //jsonParamsToSend.filesArray = Request.docsUpload.filesArray; la request ya no hace upload, hay que refactorizarlo
        jsonParamsToSend.Request = kendo.stringify(record);
        jsonParamsToSend = kendo.stringify(jsonParamsToSend);
        hyKendo.ajax({
            type: 'POST',
            contentType: "application/json; charset=utf-8",
            url: urlAction,
            datatype: "json",
            async: true,
            beforeSend: function (XMLHttpRequest) {
                XMLHttpRequest.setRequestHeader("Accept", "application/json");
            },
            data: jsonParamsToSend,
            success: function (dt, st, xhr) {
                if (st === "success") {
                    Request.hasRequestLoaded = true;
                    Request.hyBindContents();
                    hyAppRouter.goToView("Request", dt.value);

                    bootbox.alert("Request saved successfully.");
                    Request.getNextStatus(Request.currentRecord.intFirmID, Request.currentRecord.intDocumentTypeID, Request.currentRecord.intDocumentTypeStatusID, Request.currentRecord.intDocumentSubTypeID);
                }
                $.unblockUI();
            }
        });
    },

    deleteDocument: function (intID, vcLastChangeOrUpdateReason) {
        var urlAction = ROOT_URL + 'odata/Documents/deleteDocument'
        var jsonParamsToSend = {};
        //jsonParamsToSend.filesArray = Request.docsUpload.filesArray; la request ya no hace upload, hay que refactorizarlo
        jsonParamsToSend = kendo.stringify({ intID: intID, vcLastChangeOrUpdateReason: vcLastChangeOrUpdateReason });
        hyKendo.ajax({
            type: 'POST',
            contentType: "application/json; charset=utf-8",
            url: urlAction,
            datatype: "json",
            async: true,
            beforeSend: function (XMLHttpRequest) {
                XMLHttpRequest.setRequestHeader("Accept", "application/json");
            },
            data: jsonParamsToSend,
            success: function (dt, st, xhr) {
                if (st === "success") {
                    Request.hasRequestLoaded = true;
                    hyAppRouter.goToView("Home");
                    bootbox.alert("Request successfully deleted.");
                }
                $.unblockUI();
            }
        });
    },

    setViewCapability: function (dtDeactivateDate) {
        if (dtDeactivateDate !== null) {
            bootbox.dialog({
                title: "Error",
                message: "The record you are trying to access has been deleted",
                closeButton: false,
                buttons: {
                    confirm: {
                        label: '<i class="fa fa-reply"></i> Back to home page',
                        className: 'k-button',
                        callback: function (result) {
                            Request.currentRecord = null;
                            hyAppRouter.goToView("Home");
                        }
                    }
                }
            });
            $('.modal-backdrop.in').css({ 'opacity': '0.95' });
        }
    },

    exportToExcel() {
        var params = "?";
        params += "intDocumentID=" + this.currentRecord.ID;
        window.location = ROOT_URL + "Report/ExportDocumentLog" + params;
    },

    evtDelete() {
        const titlemsg = "Delete reason";
        var strmessage = "<div class='row' id='divUpdateReasonDialog'>" +
            "<div class='col-xs-12'>" +
            "<div class='divTextAreaRequiredPosition'>" +
            "<div class='form-group'>" +
            //"<textarea id='vcLastRemark' name='vcLastRemark' class='form-control' rows='5' required></textarea>" +
            "<textarea id='vcLastChangeOrUpdateReason' name='vcLastChangeOrUpdateReason' class='form-control' rows='5' required></textarea>" +
            "</div></div></div></div>";

        bootbox.dialog({
            title: titlemsg,
            message: strmessage.replaceAll('\n', ''),
            buttons: {
                cancel: {
                    label: '<span class="fa fa-reply"></span> Cancel',
                    className: "k-button"
                },
                save: {
                    label: '<span class="fa fa-trash-o"></span> Delete',
                    className: "k-button k-primary",
                    callback: function () {
                        //Guardar el ajuste
                        var $frmToValidate = $("#divUpdateReasonDialog");
                        if (createKendoValidator($frmToValidate).validate()) {
                            Request.deleteDocument(Request.currentRecord.ID, $("#vcLastChangeOrUpdateReason").val());
                        }
                        else {
                            return false;
                        } // para que no se cierre el dialogo
                    }
                }
            }
        });

    },

    disableFormControls: function () {
        $('#formRequest input').attr('readonly', 'readonly');

        var dateTimePickers = $("#formRequest input[data-role='datepicker']");
        $.each(dateTimePickers, function () {
            $(this).data("kendoDatePicker").enable(false);
        });
    },

    getIsAttatchmentEnabled: function () {
        return (Request.hasRequestLoaded);
    },

    getIsChatEnabled: function () {
        return (Request.hasRequestLoaded);
    },

    getIsNotificationEnabled: function () {
        return (Request.hasRequestLoaded);
    },

    onCurrentRecordChange() {
        if (this.currentRecord) {
            if (this.currentRecord.intThirdPartyID) {
                let filter = "intThirdPartyID eq " + Request.currentRecord.intThirdPartyID;
                if (this.currentRecord.intThirdPartyAccountID) {
                    filter += " and  ( (bIsDisabled eq false and bVatBankAccount eq false) or ( bIsDisabled eq true and ID eq " + this.currentRecord.intThirdPartyAccountID + "))";
                }
                else {
                    filter += " and  ( (bIsDisabled eq false and bVatBankAccount eq false))";
                }
                Request.dsThirdPartyAccount.setURLFilter(filter);

                let vatFilter = "intThirdPartyID eq " + Request.currentRecord.intThirdPartyID;
                if (this.currentRecord.intThirdPartyVatAccountID) {
                    vatFilter += " and  ( (bIsDisabled eq false and bVatBankAccount eq true) or ( bIsDisabled eq true and ID eq " + this.currentRecord.intThirdPartyVatAccountID + "))";
                }
                else {
                    vatFilter += " and  ( (bIsDisabled eq false and bVatBankAccount eq true))";
                }
                Request.dsThirdPartyVatAccount.setURLFilter(vatFilter);
            }

            if (Request.vcDataModelCode === 'InvoiceReceived') {
                this.dsItemGroup.setURLFilter("bIsPurchase eq false", true);

                this.refreshDsPurchaseOrders();
            }

            if (this.vcDataModelCode === "PurchaseOrder") {
                this.dsItemGroup.setURLFilter("bIsPurchase eq true", true);

                this.intDocumentTypeChange();
                this.intPurchasingTypeChange();
                this.intPurchaseOrderTypeChange();
            }
        }
    },

    intDocumentTypeChange() {
        if (this.vcDataModelCode === "PurchaseOrder") {
            if (this.currentRecord.intDocumentTypeID)
                this.dsPurchasingType.setURLFilter("intDocumentTypeID eq " + this.currentRecord.intDocumentTypeID, true);

            this.validateFrameworkContractNo();
            this.validateSRMTender();
        }
    },

    intPurchasingTypeChange() {
        if (this.vcDataModelCode === "PurchaseOrder") {
            if (this.currentRecord.intPurchasingTypeID)
                this.dsPurchaseOrderType.setURLFilter("intPurchasingTypeID eq " + this.currentRecord.intPurchasingTypeID, true);

            this.validateFrameworkContractNo();
            this.validateSRMTender();
        }
    },

    intPurchaseOrderTypeChange() {
        if (this.vcDataModelCode === "PurchaseOrder") {
            this.validateSRMTender();
        }
    },

    validateSRMTender() {
        var documentType = this.getByID(this.dsDocumentType, this.currentRecord.intDocumentTypeID);
        var purchasingType = this.getByID(this.dsPurchasingType, this.currentRecord.intPurchasingTypeID, "intPurchasingTypeID");
        var purchaseOrderType = this.getByID(this.dsPurchaseOrderType, this.currentRecord.intPurchaseOrderTypeID, "intPurchaseOrderTypeID");

        if (documentType != null && documentType.bIsPurchaseOrderSRMTenderRequired &&
            purchasingType != null && purchasingType.intPurchasingType_bIsPurchaseOrderSRMTenderRequired &&
            purchaseOrderType != null && purchaseOrderType.intPurchaseOrderType_bIsPurchaseOrderSRMTenderRequired) {
            this.setBLRequiredProperties(["vcSRMTender", "dtValidFromDate", "dtValidityEndDate"], true);
        }
        else {
            this.setBLRequiredProperties(["vcSRMTender", "dtValidFromDate", "dtValidityEndDate"], false);
        }
    },

    validateFrameworkContractNo() {
        var documentType = this.getByID(this.dsDocumentType, this.currentRecord.intDocumentTypeID);
        var purchasingType = this.getByID(this.dsPurchasingType, this.currentRecord.intPurchasingTypeID, "intPurchasingTypeID");

        if (purchasingType != null && purchasingType.intPurchasingType_bIsFrameworkContractNoRequired && documentType != null && documentType.bIsFrameworkContractNoRequired) {
            this.setBLRequiredProperty("vcFrameworkContractNo", true);
        }
        else {
            this.setBLRequiredProperty("vcFrameworkContractNo", false);
        }
    },

    removeStatusApprovedByControl: function (e) {
        let data = Request.nextStatus;
        let length = data.length;
        let item, i;
        for (i = length - 1; i >= 0; i--) {
            item = data[i];
            if (this.intPurchaseOrderApprovedByControlStatusIDs && this.intPurchaseOrderApprovedByControlStatusIDs.includes(item)) {
                this.dsDocumentTypeStatus.remove(item);
                Request.nextStatus = Request.nextStatus.filter(a => a !== item)
            }
        }
    },

    getByID(ds, id, idPropertyName) {
        if (!idPropertyName)
            idPropertyName = "ID";
        const elemts = ds.data();

        if (!elemts.length > 0) {
            return null;
        }

        let elmt = elemts.find((a) => {
            return a[idPropertyName] === id
        });

        return elmt;
    },

    refreshIntFirmIDEnabled() {
        if (this.currentRecord && !this.currentRecord.ID) {
            this.setBLEditableProperty("intFirmID", true);
        }
        else {
            this.setBLEditableProperty("intFirmID", false);
        }
    },

    refreshIntDocumentTypeIDEnabled() {
        if (this.currentRecord && !this.currentRecord.ID && Request.currentRecord.intFirmID) {
            this.setBLEditableProperty("intDocumentTypeID", true);
        }
        else {
            this.setBLEditableProperty("intDocumentTypeID", false);
        }
    },

    refreshOriginNotificationEnabled() {
        if (this.currentRecord && !this.currentRecord.ID && Request.currentRecord.intFirmID) {
            this.setBLEditableProperty("originNotificationID", true);
        }
        else {
            this.setBLEditableProperty("originNotificationID", false);
        }
    },

    refreshIntDocumentTypeStatusIDEnabled() {
        if (this.bSubTypeRequired) {
            RequestSubType.refreshIntDocumentSubTypeStatusIDEnabled();
        } else {
            this.refreshDocumentIntDocumentTypeStatusIDEnabled();
        }
    },

    refreshDocumentIntDocumentTypeStatusIDEnabled() {
        if (this.currentRecord && this.currentRecord.intDocumentTypeID) {
            this.setBLEditableProperty("intDocumentTypeStatusID", true);
        }
        else {
            this.setBLEditableProperty("intDocumentTypeStatusID", false);
        }
    },

    refreshIntThirdPartyIDEnabled() {
        if (this.currentRecord && this.currentRecord.intFirmID) {
            this.setBLEditableProperty("intThirdPartyID", true);
        }
        else {
            this.setBLEditableProperty("intThirdPartyID", false);
        }
    },

    refreshIntIncidentAssignedToIDEnabled() {
        if (this.currentRecord && this.currentRecord.bIsIncident) {
            this.setBLEditableProperty("intIncidentAssignedToID", true);
        }
        else {
            this.setBLEditableProperty("intIncidentAssignedToID", false);
        }
    },

    refreshIntPurchaseOrderIDEnabled() {
        this.setBLEditableProperty("intPurchaseOrderID", this.withPO);
    },

    refreshIntPurchaseOrderIDRequired() {
        this.setBLRequiredProperty("intPurchaseOrderID", this.withPORequired);
    },

    refreshPercentageWithTaxRequired() {
        if (this.vcNeedCertificateResidence == "true" && this.currentRecord.vcCurrentCertificate == "false") {
            this.setBLRequiredProperty("dcPercentageWithTax", true);
        }
        else {
            this.setBLRequiredProperty("dcPercentageWithTax", false);
        }
    },

    refreshPaymentAmountAuto() {
        if (this.vcDataModelCode == 'InvoiceReceived' &&
            this.vcNeedCertificateResidence == "true" &&
            this.currentRecord.vcCurrentCertificate == "false") {
            this.set("paymentAmountAuto", true);
            this.setBLEditableProperty("dcPaymentAmount", false);
            this.calculatePaymentAmount();
        }
        else {
            this.set("paymentAmountAuto", false);
            this.setBLEditableProperty("dcPaymentAmount", true);
        }
    },

    refreshThirdPartyVatAccount(updated) {
        this.set("useThirdPartyVatAccount", false);
        this.setBLRequiredProperty("dcVatValue", false);
        if (this.vcDataModelCode == 'InvoiceReceived') {
            if (this.currentRecord) {
                if (this.currentRecord.intThirdPartyID && this.currentRecord.dtInvoiceDate) {
                    var dateValue = this.currentRecord.dtInvoiceDate;
                    //HACK: En la primera carga la fecha es un string y cambiarlo parece arriesgado
                    if (typeof dateValue == "string") {
                        var dateRegExp = /^\/Date\((.*?)\)\/$/;
                        var date = dateRegExp.exec(dateValue);
                        if (date) {
                            date = date[1];
                            var offsetRegExp = /[+-]\d*/;
                            var tzoffset = offsetRegExp.exec(date.substring(1));

                            date = new Date(parseInt(date, 10));

                            if (tzoffset) {
                                tzoffset = parseMicrosoftFormatOffset(tzoffset[0]);
                                date = kendo.timezone.apply(date, 0);
                                date = kendo.timezone.convert(date, 0, -1 * tzoffset);
                            }
                        }
                        dateValue = date;
                    }
                    var url = ROOT_URL + `odata/ThirdPartys/GetThirdPartyVatAccountConfig?intThirdPartyID=${this.currentRecord.intThirdPartyID}&dtInvoiceDate='${kendo.toString(dateValue, "yyyy-MM-dd")}'`;
                    hyKendo.ajax({
                        url: url,
                        type: 'POST',
                        dataType: null,
                        data: JSON.stringify({}),
                        success: (data) => {
                            if (data && data.UseVatAccount) {
                                this.set("useThirdPartyVatAccount", true);
                                this.setBLRequiredProperty("dcVatValue", true);
                                if (updated) {
                                    this.set("currentRecord.dtChangeVatPaymentToThirdPartyVatAccount", data.dtChangeVatPaymentToThirdPartyVatAccount);
                                    this.set("currentRecord.intVatPaymentModeID", data.intVatPaymentModeID);
                                    this.set("currentRecord.intThirdPartyVatAccountID", data.intThirdPartyVatAccountID);
                                }
                            }
                            else {
                                if (updated) {
                                    this.set("currentRecord.dtChangeVatPaymentToThirdPartyVatAccount", data.dtChangeVatPaymentToThirdPartyVatAccount);
                                    this.set("currentRecord.intVatPaymentModeID", null);
                                    this.set("currentRecord.dcVatValue", 0);
                                    this.set("currentRecord.intThirdPartyVatAccountID", null);
                                }
                            }
                        },
                        complete: () => {
                            $.unblockUI();
                        }
                    });
                }
                else {
                    if (updated) {
                        this.set("currentRecord.dtChangeVatPaymentToThirdPartyVatAccount", null);
                        this.set("currentRecord.intVatPaymentModeID", null);
                        this.set("currentRecord.dcVatValue", 0);
                        this.set("currentRecord.intThirdPartyVatAccountID", null);
                    }
                }
            }
        }
    },

    refreshIntPurchasingTypeIDEnabled() {
        if (this.currentRecord && this.currentRecord.intDocumentTypeID) {
            this.setBLEditableProperty("intPurchasingTypeID", true);
        }
        else {
            this.setBLEditableProperty("intPurchasingTypeID", false);
        }
    },

    refreshIntPurchaseOrderTypeIDEnabled() {
        if (this.currentRecord && this.currentRecord.intPurchasingTypeID) {
            this.setBLEditableProperty("intPurchaseOrderTypeID", true);
        }
        else {
            this.setBLEditableProperty("intPurchaseOrderTypeID", false);
        }
    },

    applyPropertiesConfiguration() {
        this.configRequiredProperties = [];
        this.configNoEditableProperties = [];
        if (this.currentRecord.intDocumentTypeID && this.currentRecord.intDocumentTypeStatusID) {

            var documentTypeStatus = this.getByID(this.dsDocumentTypeStatus, this.currentRecord.intDocumentTypeStatusID);
            if (documentTypeStatus) {
                this.set("withPORequired", documentTypeStatus.intDocumentTypeDataModelStatusBase_bRequirePurchaseOrder);
            }

            let urlParams = `?intFirmID=${this.currentRecord.intFirmID}&intDocumentTypeID=${this.currentRecord.intDocumentTypeID}&intDocumentTypeStatusID=${this.currentRecord.intDocumentTypeStatusID}`;

            $.ajax({
                url: `odata/PersonPropertyConfigurations${urlParams}`,
                type: 'GET',
                success: (data) => {
                    if (data && data.value) {

                        data.value.forEach((item, index) => {
                            if (this.blRequiredProperties.indexOf(item.vcPropertyCode) === -1
                                && this.blNotRequiredProperties.indexOf(item.vcPropertyCode) === -1) {
                                this.setRequiredProperty(item.vcPropertyCode, item.bRequired);
                            }
                            if (this.blNoEditableProperties.indexOf(item.vcPropertyCode) === -1) {
                                this.setEditableProperty(item.vcPropertyCode, item.bEditable);
                            }
                            if (item.bRequired) {
                                this.configRequiredProperties.push(item.vcPropertyCode);
                            }
                            if (!item.bEditable) {
                                this.configNoEditableProperties.push(item.vcPropertyCode);
                            }
                        });
                    }
                },
                error: hyKendo.error.hyErrorHandler.handleAJAXException,
                complete: () => {
                    $.unblockUI();
                }
            });
        }
    },

    applyDocumentTypeConfiguration() {
        if (this.allowSelectOriginNotification &&
            this.currentRecord &&
            this.currentRecord.intDocumentTypeID) {
            var documentTypeSource = new hyDataSourceOdata({
                hyEntityName: "DocumentType",
                hyFilter: "ID eq " + this.currentRecord.intDocumentTypeID
            });
            documentTypeSource.read().then((result) => {
                if (documentTypeSource.data().length == 1) {
                    this.setRequiredProperty("originNotificationID", documentTypeSource.data()[0].bRequiresNotification);
                }
                else {
                    this.setRequiredProperty("originNotificationID", false);
                }
            });
        }
        else {
            this.setRequiredProperty("originNotificationID", false);
        }
    },

    calculatePaymentAmount() {
        if (this.paymentAmountAuto && !this.settingNeedCertificateResidenceInitialValue) {
            var dcAmount = this.currentRecord.dcAmount ? this.currentRecord.dcAmount : 0;
            var dcTaxBase = this.currentRecord.dcTaxBase ? this.currentRecord.dcTaxBase : 0;
            var dcPercentageWithTax = this.currentRecord.dcPercentageWithTax ? this.currentRecord.dcPercentageWithTax / 100 : 0;
            var newValue = (dcAmount - (dcTaxBase * dcPercentageWithTax));
            this.set("currentRecord.dcPaymentAmount", newValue);
        }
    },
    showRemarks(e) {
        var remarks = e.data.vcRemarks;
        if (remarks) {
            bootbox.dialog({
                className: "hy-remarks-dialog",
                title: "Remarks",
                message: remarks,
                closeButton: true,
                size: 'large',
                buttons: {
                    Confirm: {
                        label: "Close",
                        className: "btn-warning"
                    }
                }
            });
        }
    },

    isAmountGreaterThanPurchaseOrder() {
        if (Request.withPO && this.currentRecord.dcTaxBase && this.currentRecord.intPurchaseOrderID) {
            let urlParams = `?dcTaxBase=${this.currentRecord.dcTaxBase}&intPurchaseOrderID=${this.currentRecord.intPurchaseOrderID}&intID=${this.currentRecord.ID}`;
            $.ajax({
                url: `odata/DocumentInvoiceReceiveds/PurchaseOrderAmountCheck${urlParams}`,
                type: 'POST',
                success: (data) => {
                    if (data && data.value) {
                        $('#intPurchaseOrderID').addClass('purchaseAmountExceeded');
                        $('#purchaseAmountExceededTextMessage').removeClass('display-none');

                        if (Request.currentRecordDocTypeStatus.vcName && Request.currentRecordDocTypeStatus.vcName !== 'Draft'
                            && Request.currentRecordDocTypeStatus.vcName !== 'Rejected') {
                            this.setEditableProperty('saveBtn', false);
                        }
                        this.setEditableProperty('intDocumentTypeStatusIDBtn', false);
                        this.isAmountGreaterThanPurchaseOrderLog();

                    } else if (data && data.value === false) {
                        $('#intPurchaseOrderID').removeClass('purchaseAmountExceeded');
                        $('#purchaseAmountExceededTextMessage').addClass('display-none');

                        if (this.currentRecord.bIsEditable) {
                            this.setEditableProperty('saveBtn', true);
                            this.setEditableProperty('intDocumentTypeStatusIDBtn', true);
                        }
                    }
                },
                error: hyKendo.error.hyErrorHandler.handleAJAXException,
                complete: () => {
                    $.unblockUI();
                }
            });
        }
    },

    isAmountGreaterThanPurchaseOrderLog() {
        if (this.currentRecord.ID && this.currentRecord.dcTaxBase) {
            let urlParams = `?intDocumentID=${this.currentRecord.ID}&intPurchaseOrderID=${this.currentRecord.intPurchaseOrderID}&dcTaxBase=${this.currentRecord.dcTaxBase}`;
            $.ajax({
                url: `odata/DocumentInvoiceReceiveds/CreateDocumentExceedingPurchaseOrderAmountLog${urlParams}`,
                type: 'POST',
                error: hyKendo.error.hyErrorHandler.handleAJAXException,
                complete: () => {
                    $.unblockUI();
                }
            });
        }
    },


    getPurchaseApprovalAreaByPerson() {
        var approvalArea = this.getByID(this.dsPurchaseOrderApprovalArea, this.currentRecord.intPurchaseOrderApprovalAreaID);
        var isApprovalAreaeRequired = $('#intPurchaseOrderApprovalAreaID')[0].hasAttribute("required");
        if (Request.vcDataModelCode == 'PurchaseOrder' && approvalArea && isApprovalAreaeRequired) {
            $.ajax({
                url: `odata/DocumentPurchaseOrders/GetPurchaseApprovalAreaByPerson`,
                type: 'POST',
                success: (data) => {
                    if (data) {
                        if (!data.value.includes(approvalArea.vcCode)) {
                            this.removeStatusApprovedByControl();
                        }
                    }
                },
                error: hyKendo.error.hyErrorHandler.handleAJAXException,
                complete: () => {
                    $.unblockUI();
                }
            });
        }
    },

    getPurchaseApprovedByControlID() {
        var documentType = this.getByID(this.dsDocumentType, this.currentRecord.intDocumentTypeID);

        if (Request.vcDataModelCode == 'PurchaseOrder' && documentType) {
            let urlParams = `?vcDocumentType=${documentType.vcName}`
            $.ajax({
                url: `odata/DocumentPurchaseOrders/GetPurchaseApprovedByControlID${urlParams}`,
                type: 'POST',
                success: (data) => {
                    if (data) {
                        this.intPurchaseOrderApprovedByControlStatusIDs = data.value;
                        this.getPurchaseApprovalAreaByPerson();
                    }
                },
                error: hyKendo.error.hyErrorHandler.handleAJAXException,
                complete: () => {
                    $.unblockUI();
                }
            });
        }
    },

    requestParseDateTimeOnTemplate(recordDate) {
        var date = kendo.parseDate(recordDate);
        var result = kendo.toString(new Date(date), "s").replace("T", " ");
        return result;
    },

    setPurchasingCode() {
        return new Promise(function (resolve, reject) {
            Request.dsPurchasingType.read().then(function (e) {
                var purchasingType = Request.getByID(Request.dsPurchasingType, Request.currentRecord.intPurchasingTypeID, "intPurchasingTypeID");
                if (purchasingType)
                    Request.purchasingTypeCode = purchasingType.intPurchasingType_vcCode;
                resolve();
            });
        });
    },

    setPOTypeCode() {
        return new Promise(function (resolve, reject) {
            Request.dsPurchaseOrderType.read().then(function (e) {
                var POType = Request.getByID(Request.dsPurchaseOrderType, Request.currentRecord.intPurchaseOrderTypeID, "intPurchaseOrderTypeID");
                if (POType)
                    Request.poTypeCode = POType.intPurchaseOrderType_vcCode;
                resolve();
            });
        });
    },
});


Request.bind("change", function (e) {
    let field = e.field;
    if (field === "currentRecord") {
        this.onCurrentRecordChange();

        this.refreshIntFirmIDEnabled();
        this.refreshIntDocumentTypeIDEnabled();
        this.refreshOriginNotificationEnabled();
        this.refreshIntDocumentTypeStatusIDEnabled();
        this.isAmountGreaterThanPurchaseOrder();
        this.refreshIntThirdPartyIDEnabled();
        this.refreshIntIncidentAssignedToIDEnabled();
        this.refreshIntPurchaseOrderIDEnabled();
        this.refreshIntPurchasingTypeIDEnabled();
        this.refreshIntPurchaseOrderTypeIDEnabled();
        RequestSubType.refreshIntServiceTypeIDEnabled();
        this.refreshPercentageWithTaxRequired();
        this.refreshPaymentAmountAuto();
        this.refreshThirdPartyVatAccount(false);

        this.applyPropertiesConfiguration();
        this.applyDocumentTypeConfiguration();
        RequestSubType.refreshPurchaseEditableFields();
        

    }
    else if (field === "currentRecord.intDocumentTypeID") {
        this.set("currentRecord.intPurchasingTypeID", null);
        this.intDocumentTypeChange();
        RequestSubType.setDocumentSubTypeRequired();
        RequestSubType.setIntServiceTypeNull();
        RequestSubType.bindRequiredsIfNotOldRequest();

        this.refreshIntDocumentTypeStatusIDEnabled();
        this.refreshIntPurchasingTypeIDEnabled();
        RequestSubType.purchaseSubTypeInputsAlert();
        RequestSubType.invoiceSubTypeInputsAlert();
        RequestSubType.getDocumentSubType();

        this.set("currentRecord.intIncidentAssignedToID", null);
        this.refreshAssignedTo();

        this.applyDocumentTypeConfiguration();
    }
    else if (field === "currentRecord.intPurchasingTypeID") {
        this.set("currentRecord.intPurchaseOrderTypeID", null);
        Request.setPurchasingCode().then(() => {
            this.intPurchasingTypeChange();

            this.refreshIntPurchaseOrderTypeIDEnabled();
            RequestSubType.getDocumentSubType();
            RequestSubType.bindRequiredsIfNotOldRequest();
            this.refreshIntDocumentTypeStatusIDEnabled();
            RequestSubType.purchaseSubTypeInputsAlert();
        });
    }
    else if (field === "currentRecord.intPurchaseOrderTypeID") {
        Request.setPOTypeCode().then(() => {
            this.intPurchaseOrderTypeChange();
            RequestSubType.getDocumentSubType();
            RequestSubType.bindRequiredsIfNotOldRequest();
            this.refreshIntDocumentTypeStatusIDEnabled();
            RequestSubType.purchaseSubTypeInputsAlert();
        });

    }
    else if (field === "currentRecord.ID") {
        this.refreshIntFirmIDEnabled();
        this.refreshIntDocumentTypeIDEnabled();
        this.refreshOriginNotificationEnabled();
    }
    else if (field === "currentRecord.intFirmID") {
        this.refreshIntDocumentTypeIDEnabled();
        this.refreshOriginNotificationEnabled();
        this.refreshIntThirdPartyIDEnabled();
    }
    else if (field === "currentRecord.bIsIncident") {
        this.refreshIntIncidentAssignedToIDEnabled();
    }
    else if (field === "withPO") {
        this.refreshIntPurchaseOrderIDEnabled();
        RequestSubType.refreshIntServiceTypeIDEnabled();
        RequestSubType.setServiceTypeOptionLabel();
    }
    else if (field === "withPORequired") {
        this.refreshIntPurchaseOrderIDRequired();
    }
    else if (field === "currentRecord.intDocumentTypeStatusID") {
        this.applyPropertiesConfiguration();
        RequestSubType.refreshPurchaseEditableFields();
    }
    else if (field == "canHandleNotification" || field == "documentTypeNotificationEnabled") {
        this.refreshAllowAddNotification();
        if (field == "documentTypeNotificationEnabled") {
            this.refreshShowNotifications();
        }
    }
    else if (field === "vcNeedCertificateResidence" || field === "currentRecord.vcCurrentCertificate") {
        this.refreshPercentageWithTaxRequired();
        this.refreshPaymentAmountAuto();
    }
    else if (field === "currentRecord.intPurchaseOrderID") {
        this.isAmountGreaterThanPurchaseOrder();
        RequestSubType.setIntServiceTypeNull();
        RequestSubType.setServiceTypeOptionLabel();
        RequestSubType.getServiceTypeValue();
    }
    else if (field === "currentRecord.dcAmount") {
        this.calculatePaymentAmount();
        RequestSubType.setPurchaseAmountWarningTextAndSaveButton();
    }
    else if (field === "currentRecord.dcPercentageWithTax") {
        this.calculatePaymentAmount();
    }
    else if (field === "currentRecord.dcTaxBase") {
        this.calculatePaymentAmount();
        this.isAmountGreaterThanPurchaseOrder();
    }
    else if (field === "currentRecord.intThirdPartyID") {
        this.refreshThirdPartyVatAccount(true);
        RequestSubType.getDocumentSubType();
        this.refreshIntDocumentTypeStatusIDEnabled();
    }
    else if (field === "currentRecord.intThirdPartyCategoryID") {
        RequestSubType.getDocumentSubType();
        this.refreshIntDocumentTypeStatusIDEnabled();
        RequestSubType.setbValidationIBCompliance();
    }
    else if (field === "currentRecord.dtInvoiceDate") {
        this.refreshThirdPartyVatAccount(true);
    }
    else if (field === "currentRecord.intServiceTypeID") {
        RequestSubType.getDocumentSubType();
        this.refreshIntDocumentTypeStatusIDEnabled();
        RequestSubType.setbValidationIBCompliance();
    }
    else if (field === "currentRecord.intCecoID") {
        RequestSubType.getDocumentSubType();
        this.refreshIntDocumentTypeStatusIDEnabled();
    }
    else if (field === "originNotificationID" && !this.settingOriginNotificationID) {
        this.setOriginNotificationID(this.originNotificationID);
    }
    else if (field === "currentRecord.intPurchaseOrderApprovalAreaID") {
        if (this.intPurchaseOrderApprovedByControlStatusIDs) {
            this.getPurchaseApprovalAreaByPerson();
        } else {
            this.getPurchaseApprovedByControlID();
        }
        this.refreshIntDocumentTypeStatusIDEnabled();
    }
    else if (field === "intDocumentSubType") {
        RequestSubType.clearDocTypeStatus();
    }
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
