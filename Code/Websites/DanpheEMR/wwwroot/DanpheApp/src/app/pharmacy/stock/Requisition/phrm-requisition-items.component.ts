import { Component, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet, RouterModule, Router } from '@angular/router';

import { SecurityService } from '../../../security/shared/security.service';
import { PHRMStoreRequisition } from "../../shared/phrm-store-requisition.model"
import { PHRMStoreRequisitionItems } from "../../shared/phrm-store-requisition-items.model";
import { PharmacyBLService } from "../../shared/pharmacy.bl.service"
import { PharmacyService } from '../../shared/pharmacy.service';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { PHRMItemMasterModel } from "../../shared/phrm-item-master.model";
//import { VendorMaster } from "../shared/vendor-master.model";
import { CoreBLService } from "../../../core/shared/core.bl.service";
import { DanpheCache, MasterType } from '../../../shared/danphe-cache-service-utility/cache-services';
@Component({

      templateUrl: "./phrm-requisition-items.component.html"

})
export class PHRMRequisitionItemsComponent {

      ////binding logic
      public currentRequItem: PHRMStoreRequisitionItems = new PHRMStoreRequisitionItems();
      public requisition: PHRMStoreRequisition = new PHRMStoreRequisition();
      ////this Item is used for search button(means auto complete button)...
      public ItemList: Array<any> = [];
      ////this is to add or delete the number of row in ui
      public rowCount: number = 0;
      public checkIsItemPresent: boolean = false;
      department: Array<any> = new Array<any>();

      //For Add Item --Yubraj 2nd April 2019
      public index: number = 0;
      public showAddItemPopUp: boolean = false;

      constructor(
            public changeDetectorRef: ChangeDetectorRef,
            public phrmBLService: PharmacyBLService,
            public phrmService: PharmacyService,
            public securityService: SecurityService,
            public router: Router,
            public messageBoxService: MessageboxService,
            public coreBLService: CoreBLService) {
            ////pushing currentPOItem for the first Row in UI 
            this.requisition.RequisitionItems.push(this.currentRequItem);
            this.currentRequItem.Quantity = 1;
            this.LoadItemList();
            //this.GetDepartment();
      }
      ////to load the item in the start
      LoadItemList(): void {
            this.phrmBLService.GetItemListForStoreRequisition()
                  .subscribe(res => this.CallBackGetItemList(res));
      }
      CallBackGetItemList(res) {
            if (res.Status == 'OK') {
                  this.ItemList = [];
                  if (res && res.Results) {
                        res.Results.forEach(a => {
                              this.ItemList.push({
                                    "ItemId": a.ItemId, "ItemName": a.ItemName,
                                    "BatchNo": a.BatchNo
                              });
                        });
                  }
            }
            else {
                  err => {
                        this.messageBoxService.showMessage("failed", ['failed to get Item.. please check log for details.']);
                        this.logError(err.ErrorMessage);
                  }
            }
      }
      ////add a new row 
      AddRowRequest() {
            for (var i = 0; i < this.requisition.RequisitionItems.length; i++) {
                  // for loop is used to show RequisitionItemValidator message ..if required  field is not filled
                  for (var a in this.requisition.RequisitionItems[i].RequisitionItemValidator.controls) {
                        this.requisition.RequisitionItems[i].RequisitionItemValidator.controls[a].markAsDirty();
                        this.requisition.RequisitionItems[i].RequisitionItemValidator.controls[a].updateValueAndValidity();
                  }
            }
            //row can be added if only if the item is selected is last row
            //if (this.currentRequItem.ItemId != 0 && this.currentRequItem.ItemId != null) {
            this.rowCount++;
            this.currentRequItem = new PHRMStoreRequisitionItems();
            this.currentRequItem.Quantity = 1;
            this.requisition.RequisitionItems.push(this.currentRequItem);
      }
      ////to delete the row
      DeleteRow(index) {
            //this will remove the data from the array
            this.requisition.RequisitionItems.splice(index, 1);
            // if the index is 0 then ..  currentPOItem is pushhed in POItems to show the textboxes
            if (index == 0) {
                  this.currentRequItem = new PHRMStoreRequisitionItems();
                  this.requisition.RequisitionItems.push(this.currentRequItem);
                  this.currentRequItem.Quantity = 1;
                  this.changeDetectorRef.detectChanges();
            }
      }

      SelectItemFromSearchBox(Item: PHRMItemMasterModel, index) {
            //if proper item is selected then the below code runs ..othewise it goes out side the function
            if (typeof Item === "object" && !Array.isArray(Item) && Item !== null) {
                  //this for loop with if conditon is to check whether the  item is already present in the array or not 
                  //means to avoid duplication of item
                  for (var i = 0; i < this.requisition.RequisitionItems.length; i++) {
                        if (this.requisition.RequisitionItems[i].ItemId == Item.ItemId) {
                              this.checkIsItemPresent = true;
                        }
                  }
                  //id item is present the it show alert otherwise it assign the value
                  if (this.checkIsItemPresent == true) {
                        this.messageBoxService.showMessage("notice-message", [Item.ItemName + " is already add..Please Check!!!"]);
                        this.checkIsItemPresent = false;
                        this.changeDetectorRef.detectChanges();
                        this.requisition.RequisitionItems.splice(index, 1);
                        this.currentRequItem = new PHRMStoreRequisitionItems();
                        this.currentRequItem.Quantity = 1;
                        this.requisition.RequisitionItems.push(this.currentRequItem);
                  }
                  else {
                        for (var a = 0; a < this.requisition.RequisitionItems.length; a++) {
                              // Assiging the value StandardRate,VatPercentage and ItemId in the particular index ..
                              //it helps for changing item after adding the item and also in adding in new item
                              if (a == index) {
                                    this.requisition.RequisitionItems[index].ItemId = Item.ItemId;
                              }
                        }
                  }
            }
      }
      ////used to format display item in ng-autocomplete
      myListFormatter(data: any): string {
            let html = data["ItemName"] + " |B.No.|" + data["BatchNo"];
            // if (data["BatchNo"] = null) { html += "| <p style='color:blue'>new</p>" }
            // else { html += " |B.No.|" + data["BatchNo"] }
            return html;
      }
      ////posting to db
      AddRequisition() {
            // this CheckIsValid varibale is used to check whether all the validation are proper or not ..
            //if the CheckIsValid == true the validation is proper else no
            var CheckIsValid = true;
            if (this.requisition.IsValidCheck(undefined, undefined) == false) {
                  // for loop is used to show RequisitionValidator message ..if required  field is not filled
                  for (var a in this.requisition.RequisitionValidator.controls) {
                        this.requisition.RequisitionValidator.controls[a].markAsDirty();
                        this.requisition.RequisitionValidator.controls[a].updateValueAndValidity();
                  }
                  CheckIsValid = false;
            }
            for (var i = 0; i < this.requisition.RequisitionItems.length; i++) {
                  if (this.requisition.RequisitionItems[i].IsValidCheck(undefined, undefined) == false) {

                        // for loop is used to show RequisitionItemValidator message ..if required  field is not filled
                        for (var a in this.requisition.RequisitionItems[i].RequisitionItemValidator.controls) {
                              this.requisition.RequisitionItems[i].RequisitionItemValidator.controls[a].markAsDirty();
                              this.requisition.RequisitionItems[i].RequisitionItemValidator.controls[a].updateValueAndValidity();
                        }
                        CheckIsValid = false;
                  }
            }

            if (CheckIsValid == true && this.requisition.RequisitionItems != null) {
                  //Updating the Status
                  this.requisition.RequisitionStatus = "active";
                  //Comment by Nagesh on 11-Jun-17 Employee Id not getting so, now passing static id
                  this.requisition.CreatedBy = this.securityService.GetLoggedInUser().EmployeeId;
                  for (var i = 0; i < this.requisition.RequisitionItems.length; i++) {
                        this.requisition.RequisitionItems[i].RequisitionItemStatus = "active";
                        this.requisition.RequisitionItems[i].CreatedBy = this.securityService.GetLoggedInUser().EmployeeId;
                        this.requisition.RequisitionItems[i].AuthorizedBy = this.securityService.GetLoggedInUser().EmployeeId;
                        //Comment on 02-July'17 By-Nagesh-No need to send Item Object with requisitionItems only Need ItemId
                        this.requisition.RequisitionItems[i].ItemId = this.requisition.RequisitionItems[i].ItemId;
                        this.requisition.RequisitionItems[i].Item = null;
                  }
                  this.phrmBLService.PostToRequisition(this.requisition).
                        subscribe(res => {
                              if (res.Status == 'OK') {
                                    this.messageBoxService.showMessage("success", ["Requisition is Generated and Saved"]);
                                    this.changeDetectorRef.detectChanges();
                                    ////deleting all creating new requisition..after successully adding to db
                                    this.requisition.RequisitionItems = new Array<PHRMStoreRequisitionItems>();
                                    this.requisition = new PHRMStoreRequisition();
                                    this.currentRequItem = new PHRMStoreRequisitionItems();
                                    this.currentRequItem.Quantity = 1;
                                    this.requisition.RequisitionItems.push(this.currentRequItem);
                                    //route back to requisition list
                                    this.RouteToViewDetail(res.Results);
                              }
                              else {
                                    err => {
                                          this.messageBoxService.showMessage("failed", ['failed to add Requisition.. please check log for details.']);
                                          this.logError(err.ErrorMessage);
                                          //route back to requisition list
                                          this.router.navigate(['/Pharmacy/Stock/StoreRequisition']);
                                    }
                              }
                        });
            }

      }
      ////this is to cancel the whole PO at one go and adding new PO
      Cancel() {
            this.requisition.RequisitionItems = new Array<PHRMStoreRequisitionItems>();
            this.requisition = new PHRMStoreRequisition();
            this.currentRequItem = new PHRMStoreRequisitionItems()
            this.currentRequItem.Quantity = 1;
            this.requisition.RequisitionItems.push(this.currentRequItem);
            //route back to requisition list
            this.router.navigate(['/Pharmacy/Stock/StoreRequisition']);
      }
      logError(err: any) {
            console.log(err);
      }

      RouteToViewDetail(data) {
            //pass the Requisition Id to RequisitionView page for List of Details about requisition
            this.phrmService.Id = data;
            this.router.navigate(['/Pharmacy/Stock/StoreRequisitionDetails']);

      }
}
