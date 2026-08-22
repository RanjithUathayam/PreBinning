import { Component, OnInit, AfterContentInit, AfterViewInit,ViewChild, ElementRef  } from '@angular/core';
import { Barcode, BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { AlertController, IonItemGroup } from '@ionic/angular';
import { ApiService } from '../services/api.service';
import { HttpClient } from '@angular/common/http';
import { Console, log } from 'console';
import { Action } from 'rxjs/internal/scheduler/Action';
import { Html5Qrcode, Html5QrcodeScanner } from 'html5-qrcode';
import { Html5QrcodeError, Html5QrcodeResult } from 'html5-qrcode/esm/core';
import { IonInput } from '@ionic/angular';
import { LoadingService } from '../services/loading.service';

declare class ImageCapture {
  constructor(videoTrack: MediaStreamTrack);
  getPhotoCapabilities(): Promise<{ torch: boolean }>;
}
@Component({
  selector: 'app-storein',
  templateUrl: './storein.page.html',
  styleUrls: ['./storein.page.scss'],
})

export class StoreinPage implements OnInit, AfterViewInit {
    constructor(private alertController: AlertController, private apiservice: ApiService,public loadingService: LoadingService) {
    }
    ngOnInit(): void {
        console.log('grndata',this.grndataArr)
        this.getDefaultSelectedGrnData();
    }

    ngAfterViewInit(): void {
        this.GetDetails();
    }
    @ViewChild('inputField') inputField!: ElementRef;
    @ViewChild('inputdeleteField') inputdeleteField!: ElementRef;
    @ViewChild('grnSelect') grnSelect!: ElementRef;
    @ViewChild('scrollContent') scrollContent!: ElementRef;
    @ViewChild('scrollContent1') scrollContent1!: ElementRef;
    @ViewChild('scanModal') scanModal!: ElementRef; // Reference to the modal
    private html5Qrcode: Html5Qrcode | null = null;
    camSet: number = 0;
    grnlist: any;
    remarkslist:any=[]
    selectedGrnNo: any;              // to store the selected grn no
    grndataArr: any[] = []           // main array to store the grn data
    scanbinicon: boolean = false;    // to show the trash icon
    binIdSelectvalue: any;           // to store the value after bin selected 
    binIdSelect : any;               // to store the value bin value
    selectedBinIds: string[] = [];   //array to maintain the bin ids
    binIdselect1:any;                // to store the bin id after its validation is correct
    scanbin: boolean = false;        // to show the grndetails card
    binQty: number = 0;              // to store the maxbinlimit if there is items already present
    visible_item: boolean = false;   // to show the item details text
    maxValidate : number = 0         // to set the maximum limit to add (changes based on count)
    maxLimit : number = 0            // to set the maximum limit to add  (should be get from api)
    scannedArray: any[]=[]           //array to maintain the scanned items (individual)
    tempArray : any[] = []           //array to maintain the scanned items 
    qntyCnt : number = 0              //to maintain the count of scanned items send to api
    distinctArray : any[] = []       // to maintain tha array for each bin
    isModalOpen = false;            // to show the view details link
    getdeleteitem: any;             // to store the value of deleted item 
    remark: any;                    // to store the value of remark
    deleteinputbin: boolean = false; // to show the delete input box
    quantity: any = 0;              // to store the quantity for api
    itemCompleteArray : any[] = []  // for complete item remarks
    isInputFilled: boolean = false;  // to show grn details card
    isGrnSelected: boolean = false;
    camFlag: boolean = false;
    extractedData: any;
    btnitemcomp : boolean = false;
    selectElement:any;
    qty: number = 0
    binTempArray :any[] = [];
    binDetails:boolean = false
    itemDetails:boolean = false
    colorMapping: { [key: string]: string } = {
        'Red': '#FF0000',
        'Black': '#000000',
        'Green': '#008000',
        'Purple': '#800080',
        'Yellow': '#FFFF00',
        'Cotton': '#FFFFFF',
        'Pink': '#FFC0CB',
        'Blue': '#0000FF',
        'Grey': '#808080',
        'Violet': '#EE82EE',
        'Orange': '#FFA500',
        'Cotton2': '#FFFFFF',
        'Brown': '#A52A2A',
        'Beige': '#F5F5DC',
        'Navy': '#000080',
        'Maroon': '#800000',
        'Teal': '#008080',
        'Cyan': '#00FFFF',
        'Magenta': '#FF00FF',
        'Olive': '#808000',
        'Turquoise': '#40E0D0',
        'Silver': '#C0C0C0',
        'Gold': '#FFD700',
        'Peach': '#FFE5B4',
        'Lavender': '#E6E6FA'
    };
    
    btnenabled : boolean = true;

    selectedGrnumber(event: any) {
        this. selectElement = event.target as HTMLSelectElement;
        this.selectedGrnNo = this.selectElement.value;
        this.isGrnSelected = !!this.selectedGrnNo; // Set to true if a GRN No is selected
        this.isInputFilled = this.isGrnSelected;
        localStorage.setItem('selectedGrnNo', this.selectedGrnNo);
        this.GetGrnNumberDetails(this.selectedGrnNo);

        if (this.isGrnSelected) {
            this.selectElement.disabled = true; // Disable the select element
        }

        setTimeout(() => {
            if (this.inputField && this.inputField.nativeElement) {
                this.inputField.nativeElement.focus();
              }
        }, 0);
    }

    getDefaultSelectedGrnData() {
        if (localStorage.getItem('selectedGrnNo')) {
            this.selectedGrnNo = localStorage.getItem('selectedGrnNo');
            this.isGrnSelected = !!this.selectedGrnNo;  
            this.isInputFilled = this.isGrnSelected;
            this.GetGrnNumberDetails(this.selectedGrnNo);  
            setTimeout(() => {
                if (this.inputField && this.inputField.nativeElement) {
                    this.inputField.nativeElement.focus();
                    }
            }, 0);
            }
    }
  
    async GetGrnNumberDetails(grnNp: any) {
        try 
        {
            this.loadingService.presentLoading();            
            const res: any = await this.apiservice.SendSelectedGrn(grnNp).toPromise();
            if (res.status === 1) {
                this.grndataArr = res.data;
                this.loadingService.dismissLoading();
                console.log('grndata',this.grndataArr)
                this.extractedData = this.grndataArr.map((item: any) => ({
                  BinCapacity: item.BinCapacity,
                  Binning_Qty: item.Binning_Qty,
                  GRNNo: item.GRNNo,
                  ItemName: item.ItemName,
                  Quantity: item.Quantity,
                  ItemGroup: item.ItemGroup,
                  ItemCode: item.ItemCode,
              }));
                this.maxLimit = this.grndataArr[0].BinCapacity
            } 
            else 
            {
                this.presentAlert(res.message, '');
            }
        } 
        catch (error:any) {
            this.loadingService.dismissLoading();
            this.presentAlert(error.message, '');
        }
    }

    async grnrefresh() {
        const alert = await this.alertController.create({
            header: 'D0 YOU WANT TO CHANGE THE GRN?',
            buttons: this.alertButtonsrefresh,
            cssClass: 'custom-alert'
        });
        await alert.present();
    }

    async bincomplete() 
    {
        if(this.selectedBinIds.length == 0 && this.itemDetails == false)
        {
            this.binscan();
            this.modalclose();
            return
        }

        if(this.maxValidate <= 0)
        {
            const alert = await this.alertController.create({
                header: 'ITEM NOT SCANNED',
                buttons: this.compbinealert,
                cssClass: 'custom-alert'
            });

            await alert.present();
            return
        }

        if (this.scannedArray.length > 0) 
        {
            const alert = await this.alertController.create({
                header: 'ARE YOU SURE TO COMPLETE BIN?',
                buttons: this.alertButtonscompletebin,
                cssClass: 'custom-alert'
            });

            await alert.present()

        }
        else
        {
            const alert = await this.alertController.create({
                header: 'ITEM NOT SCANNED',
                buttons: this.compbinealert,
                cssClass: 'custom-alert'
            });

            await alert.present();
        }
    }

    SelectBinId(event: any, inputField: HTMLInputElement) {
        this.scanbinicon = true;
        this.binIdSelectvalue = event.target.value; // Contains the value of the selected bin

        try 
        {
            if (this.binIdSelectvalue.includes('|') && this.binIdselect1) // Check if the value contains '|' and bin id selected and itemcode entered
            { 
              if(this.maxLimit!=0){
                this.ScanItemCode(event, this.binIdSelectvalue);
                this.focusInputField();
                // Clear the input field and change the placeholder
                inputField.value = '';
                inputField.placeholder = 'scan item code to add';
              }
              else{
                this.presentAlert('Bin Limit reached', '');
                this.focusInputField();
                // Clear the input field and change the placeholder
                inputField.value = '';
                inputField.placeholder = 'scan bin id';
              }
                //this.ScanItemCode(event, this.binIdSelectvalue);
               
            } 
            else if (this.binIdSelectvalue.includes('|') && !this.binIdselect1)
            { // Bin id not selected but itemcode entered
                this.binscan();
                const inputElement = document.getElementById('ip') as HTMLInputElement | null;
                if (inputElement) 
                {
                    inputElement.value = '';
                }
                inputField.placeholder = 'scan bin id';
            }
            else 
            { 
                // Validation for bin id select
                const isValidLength = this.binIdSelectvalue.length < 25;
                this.binIdSelect = event.target.value; // Contains the value of the selected bin

                if (this.selectedBinIds.length == 0) // Push the value to select bin id array
                { 
                    this.binDetails = true;
                    this.itemDetails = false;
                    if (isValidLength) 
                    {
                      this.processBinId(inputField)
                    }
                    else 
                    {
                        this.presentAlert('Invalid bin ID', '')
                    }
                } 
                else 
                {
          
                    if(this.itemDetails == true && this.maxLimit!=0) 
                    {
                        this.presentAlert('COMPLETE THE BIN', '')
                        return;
                    } 
                    else 
                    {
                        this.binTempArray = []
                        this.qty = 0
                        this.selectedBinIds = []
                        this.processBinId(inputField);
                    }
                
               
              }
            }
        } 
        catch (error: any) {
            console.error('Error in SelectBinId:', error);
            this.presentAlert(error.message, '')
        }
    }

    processBinId(inputField: any) 
    {
        this.selectedBinIds.push(this.binIdSelect);
        
        let obj = { // Send the bin id selected to API as obj
            BinID: this.selectedBinIds[0]
        };
         this.loadingService.presentLoading();   
        this.apiservice.getBinIdInfo(obj).subscribe((res: any) => {
            this.loadingService.dismissLoading();
            try 
            {
                if (res.status === 1) 
                {
                    this.binIdselect1 = this.binIdSelect;
                    this.scanbin = true;
                    this.maxLimit = this.grndataArr[0].BinCapacity
                    for(let i = 0; i < res.data.length; i++) 
                    {
                        let temp = {...res.data[i], GRNQuantity : this.grndataArr[0].Quantity};
                        this.qty = this.qty +  Number(res.data[i].Quantity);
                        this.binTempArray.push(temp);
                    }

                    this.maxLimit = this.maxLimit - this.qty;                    
                    this.binQty = res.data.reduce((total: number, item: { Quantity: any; }) => total + Number(item.Quantity), 0); // Get the quantity from the binDetails and store it in binQty

                    if (this.binIdSelectvalue)       // Clearing the input field and change the placeholder to scan item code after the first item is scanned
                    { 
                        const inputElement = document.getElementById('ip') as HTMLInputElement | null;
                        if (inputElement) 
                        {
                            inputElement.value = '';
                        }
                    }
                    inputField.placeholder = 'scan item code';
                    const inputElement = document.getElementById('ip') as HTMLInputElement | null;
                        if (inputElement) 
                        {
                            inputElement.value = '';
                        }

                        this.modalclose()
                } 
                else 
                {
                    //this.maxLimit =
                    this.selectedBinIds = []
                    this.scanbin = false;
                    this.binIdselect1= false
                    const inputElement = document.getElementById('ip') as HTMLInputElement;
                    inputElement.value = '';
                    inputElement.placeholder = 'Scan Bin Id';
                    this.presentAlert(res.message, '')
                    this.modalclose()
                }
            } 
            catch (error: any) 
            {
                this.presentAlert(error.message, '')
                this.modalclose()
            }
        }, (error) => {
            this.loadingService.dismissLoading();
            this.presentAlert(error.message, '')
        });
    }

    grounpCntReduce : any;
    getRemarks: boolean = false;
    isBinExists: boolean = false;
    ScanItemCode(event: any, itemcod: any): void {
        let flag = 0;
        this.visible_item = true;
        this.binDetails = false;
        this.itemDetails = true;
        let itemCode = itemcod.split('|')[0];
        let itemGroup = itemcod.split('|')[3];
        let docNo = itemcod.split('|')[2];
        this.scrollUp();
        const itemExistAlready = this.scannedArray.some((item: any) => item.QRCode === itemcod);
        // const itemGrpExist = this.scannedArray.some((item: any) => item.ItemGroup === itemGroup && item.BinID === this.binIdSelect); // to check whether the item group is scanned previously
        // let BinLength = this.scannedArray.some((item: any) => item.BinID === this.binIdSelect);

    
        // Move the scanned item to the top of the grndataArr
        const itemIndex = this.grndataArr.findIndex((item: any) => item.ItemCode === itemCode);
        if (itemIndex !== -1) {
            const [scannedItem] = this.grndataArr.splice(itemIndex, 1); // Remove the item from its current position
            this.grndataArr.unshift(scannedItem); // Add it to the beginning of the array
        }
    
        // Create a new array to store the extracted fields and increase the quantity for the given ItemCode
        let nextFlag = false;
        const grnPresentArray = this.grndataArr.filter((item: any) => item.ItemCode === itemCode);
        for (let i = 0; i < this.grndataArr.length; i++) {
            let item = this.grndataArr[i];
            this.grounpCntReduce = this.grndataArr[i];
            if (item.ItemCode === itemCode && itemExistAlready === false && (this.maxValidate < this.maxLimit) && grnPresentArray[0].GRNStatus != 'Completed') 
            {
                let updatedQty = parseInt(item.Binning_Qty) + 1;
                if (updatedQty <= parseInt(item.Quantity)) {
                    item.Binning_Qty = updatedQty;
                    nextFlag = true;
                    this.getRemarks = true;
                    if(updatedQty == parseInt(item.Quantity))
                    {
                        this.getRemarks = false;
                    }
                } else {
                    this.itempresent('ITEM LIMIT REACHED', '');
                    const inputElement = document.getElementById('ip') as HTMLInputElement | null;
                    if (inputElement) {
                        inputElement.value = '';
                    }
                    nextFlag = false;
                    break;
                }
            }
            else{
                nextFlag=true
            }
        }
    
        if (nextFlag) {
            const grnPresent = this.grndataArr.some((item: any) => item.ItemCode === itemCode);
            const selectedItem = this.grndataArr.find(item => item.ItemCode === itemCode);
            const grnPresentArray = this.grndataArr.filter((item: any) => item.ItemCode === itemCode);
            // this.grnPresentArray = grnPresent;
            // console.log('grnPresentArray', grnPresentArray[0].GRNStatus
            //     );
            if (grnPresent) {
                if(grnPresentArray[0].GRNStatus == 'Completed'){
                    console.log('Item Already Completed');
                    this.itemDetails = false
                    this.itempresent('ITEM ALREADY COMPLETED', '');
                    return
                }
                if (this.maxValidate < this.maxLimit) {
                    if (this.scannedArray.length == 0) {  // execute for first time when there is no item in the array
                        this.maxValidate++;
                        this.tempArray = [{ BinID: this.binIdSelect, GRNNo: this.selectedGrnNo, DocNO: docNo, ItemCode: itemCode, ItemGroup: itemGroup, ItemName: selectedItem.ItemName, Quantity: selectedItem.Quantity, indQuantity: this.qntyCnt++, QRCode: itemcod }];
                        this.scannedArray = [...this.scannedArray, ...this.tempArray];
                    } 
                    else 
                    {
                        const itemGrpExist = this.scannedArray.some((item: any) => item.ItemGroup === itemGroup && item.BinID === this.binIdSelect); // to check whether the item group is scanned previously
                        let BinLength = this.scannedArray.some((item: any) => item.BinID === this.binIdSelect);
                        if ((!itemGrpExist) && (BinLength)) {  // if item group is not scanned previously
                           
                            for (let i = 0; i < this.grndataArr.length; i++) 
                            {
                                let item = this.grndataArr[i];
                                if((item.ItemCode == itemCode) && (item.Binning_Qty > 0))
                                {
                                    this.grounpCntReduce = this.grndataArr[i]; 
                                    let updatedQty = parseInt(item.Binning_Qty) - 1;
                                    item.Binning_Qty = updatedQty; 
                                }
                            }
                            this.itempresent('DIFFERENT ITEM GROUP', '')
                            const inputElement = document.getElementById('ip') as HTMLInputElement | null;
                            if (inputElement) {
                                inputElement.value = '';
                            }
                            return;
                        } else {
                            const itemExist = this.scannedArray.some((item: any) => item.QRCode === itemcod); // if already present it should not add it should be unique
                            if (itemExist) {
                                this.itempresent('ITEM ALREADY SCANNED', '')
                                const inputElement = document.getElementById('ip') as HTMLInputElement | null;
                                if (inputElement) {
                                    inputElement.value = '';
                                }
                            } else {
                                this.maxValidate++;
                                let tempArray = [{ BinID: this.binIdSelect, GRNNo: this.selectedGrnNo, DocNO: docNo, ItemCode: itemCode, ItemGroup: itemGroup, ItemName: selectedItem.ItemName, Quantity: selectedItem.Quantity, indQuantity: this.qntyCnt++, QRCode: itemcod }];
                                this.scannedArray = [...this.scannedArray, ...tempArray];
                            }
                        }
                    }
    
                    // Finding Distinct Item Code with Count
                    const itemCounts: { [key: string]: { count: number, details: any } } = {};
                    this.scannedArray.forEach(item => {
                        if (itemCounts[item.ItemCode]) {
                            itemCounts[item.ItemCode].count++;
                        } else {
                            itemCounts[item.ItemCode] = {
                                count: 1,
                                details: item
                            };
                        }
                    });
    
                    // To display distinct item code with count and other details in Card
                    this.distinctArray = Object.keys(itemCounts).map(key => ({
                        ...itemCounts[key].details,
                        Count: itemCounts[key].count
                    }));
    
                    // Fetch Binning Qty if I provide the ItemCode
                    let binning_qty = this.grndataArr.find((item: any) => item.ItemCode === itemCode)?.Binning_Qty;
                    let Quantity = this.grndataArr.find((item: any) => item.ItemCode === itemCode)?.Quantity;
                    // Item Max Limit Checking
                    let calcIndex = this.distinctArray.findIndex((item: any) => item.ItemCode === itemCode);
                    let compareMaxItemLimit = this.distinctArray[calcIndex].Quantity - this.distinctArray[calcIndex].Count;
                    // if(this.distinctArray[calcIndex].Quantity < (this.distinctArray[calcIndex].Count))
                    // if(binning_qty <= Quantity)
                    // {
                    //     // this.itempresent('ITEM LIMIT REACHED', 'Once Bin Qty Reached CLICK ON COMPLETE BIN & COMPLETE ITEM')
                    //     this.itempresent('ITEM LIMIT REACHED', '')
                    //     const inputElement = document.getElementById('ip') as HTMLInputElement | null;
                    //     if (inputElement) 
                    //     {
                    //         inputElement.value = '';
                    //     }
                    //                 // itemCounts[this.distinctArray[calcIndex].ItemCode].count--; 
                    //                 // this.distinctArray[calcIndex].Count--;
                    //     this.maxValidate--;
                    //     // this.scannedArray = this.scannedArray.filter((item : any) => item.QRCode !== itemcod);
                    //     return;
                    // }
                } else {
                    this.itempresent('BIN LIMIT REACHED', 'COMPLETE THE BIN')
                    const inputElement = document.getElementById('ip') as HTMLInputElement | null;
                    if (inputElement) {
                        inputElement.value = '';
                    }
                    return;
                }
            } else {
                this.visible_item = false
                this.itempresent('ITEM NOT PRESENT', '')
                if(this.scannedArray.length < 1){
                    this.itemDetails = false;
                }

            }
    
            const binIdExist = this.scannedArray.some((item: any) => item.BinID === this.binIdSelect);
            this.isBinExists = binIdExist;

            if (!binIdExist) {
                this.selectedBinIds = []
                return;
            }
        }

       this.modalclose();
    }

    ShowViewDetails(isOpen: boolean) {
        this.isModalOpen = isOpen;
    }

    ScanItemDelete(event: any, inputField: HTMLInputElement) {
        this.getdeleteitem = event.target.value;
        this.deleteItem(this.getdeleteitem);
        this.modalclose()
    }

     deleteItem(itemcod: any): void 
        {
            console.log('nnnn');
            // alert('Are you sure to delete?');
            const itemIndex = this.scannedArray.findIndex(item => item.QRCode === itemcod);
            console.log('sc',this.scannedArray);
            // if(this.scannedArray[itemIndex].BinID.length <=1){
               
            //     this.itemDetails = false;
            // }

            this.grndataArr = this.grndataArr.map((item: any) => {
                if (
                    (item.ItemCode === (itemcod.split('|')[0])) &&  // Check if the item code matches
                    (parseInt(item.Binning_Qty) >= 0) &&            // Ensure Binning_Qty is non-negative
                    (itemIndex !== -1) &&                           // Check if itemIndex is valid
                    (this.scannedArray[itemIndex].BinID === this.binIdselect1) // Check if BinID matches
                ) {
                    return {
                        BinCapacity: item.BinCapacity,
                        Binning_Qty: (parseInt(item.Binning_Qty) - 1).toString(),
                        GRNNo: item.GRNNo,
                        ItemName: item.ItemName,
                        Quantity: item.Quantity, // Increase the quantity by 1
                        ItemGroup: item.ItemGroup,
                        ItemCode: item.ItemCode,
                        Type: item.Type
                    };
                } else {
                    // alert('Binned Quantity should not be greater than Total  Quantity');
                    return {
                        BinCapacity: item.BinCapacity,
                        Binning_Qty: item.Binning_Qty,
                        GRNNo: item.GRNNo,
                        ItemName: item.ItemName,
                        Quantity: item.Quantity,  
                        ItemGroup: item.ItemGroup,
                        ItemCode: item.ItemCode,
                        Type: item.Type
                    };
                }
            });
        
            // Find the item in the scannedArray
            // const itemIndex = this.scannedArray.findIndex(item => item.ItemCode === itemcod);
            if (itemIndex === -1) {
                this.itemnotdelete()
                if (this.inputdeleteField) {
                this.inputdeleteField.nativeElement.value = '';
            }
                return;
            }
        
            if(this.scannedArray[itemIndex].BinID === this.binIdselect1)
            {
                // Get the item details
                const itemDetails = this.scannedArray[itemIndex];
                const itemCode = itemDetails.ItemCode;
            
                // Remove the item from the scannedArray
                this.scannedArray.splice(itemIndex, 1);
                this.maxValidate--;
                console.log('grndata',this.grndataArr)
            
                // Update the count in the distinctArray
                const distinctItemIndex = this.distinctArray.findIndex(item => item.ItemCode === itemCode);
                if (distinctItemIndex !== -1) {
                    this.distinctArray[distinctItemIndex].Count--;
            
                    // If count becomes zero, remove the item from the distinctArray
                    if (this.distinctArray[distinctItemIndex].Count === 0) {
                        this.distinctArray.splice(distinctItemIndex, 1);
                    }
                }
                if (this.inputdeleteField) {
                this.inputdeleteField.nativeElement.value = '';
            }
            }
            else
            {
                this.itempresent('CHANGE BIN', '')
                if (this.inputdeleteField) {
                this.inputdeleteField.nativeElement.value = '';
            }
                return;
            }

            const binIdExist = this.scannedArray.some((item : any) => item.BinID === this.binIdSelect);
            this.isBinExists = binIdExist;
            if(!binIdExist)
            {
                this.selectedBinIds = [];
                this.binTempArray = [];
                if (this.inputdeleteField) {
                this.inputdeleteField.nativeElement.value = '';
            }
                return;
            }

            if (this.inputdeleteField) {
                this.inputdeleteField.nativeElement.value = '';
            }
            this.modalclose()
    }
     enableBtn(itemCode : any)
        {
            let result = this.scannedArray.some((item : any) => item.ItemCode === itemCode);
            return result
        }

    calculateTotalQuantity() {
        return this.grndataArr.reduce((sum, item) => sum + Number(item.Quantity), 0);
    }

    calculateTotalBinningQuantity() {
        return this.grndataArr.reduce((sum, item) => sum + Number(item.Binning_Qty), 0);
    }
    
    focusInputField() {
        setTimeout(() => {
            if (this.inputField && this.inputField.nativeElement) {
                this.inputField.nativeElement.focus();
              }
        }, 0);
    }

    focusInputDeleteField() {
        setTimeout(() => {
            if (this.inputdeleteField && this.inputdeleteField.nativeElement) {
                this.inputdeleteField.nativeElement.focus();
              }
        }, 0);
    }

    getBackgroundColor(itemName: string): string {
        const colorKey = itemName.split(' ').slice(-2, -1)[0];
        return this.colorMapping[colorKey] || '#FFC0CB';
    }
    getItemTypeAndColorCode(itemName: string): { itemType: string | null, colorCode: string | null } {
        const parts = itemName.split(" ");
        let itemType: string | null = null;
        let colorCode: string | null = null;
        if (parts.length > 0) {
            itemType = parts.slice(-1).join(" ");
        }
        if (parts.length > 1) {
            colorCode = parts.slice(-2).join(" ");
        }
        return { itemType, colorCode };
    }

    getCssFilter(itemName: string): string {
        const colorKey = itemName.split(' ')[0]; // Assumes the color is the first word in itemName
        switch (colorKey) {
            case 'RED': return 'hue-rotate(0deg) brightness(1) saturate(1)';
            case 'Orange': return 'hue-rotate(30deg) brightness(1) saturate(1)';
            case 'Yellow': return 'brightness(1.2) saturate(1.2)';
            case 'Green': return 'hue-rotate(120deg) brightness(1) saturate(1)';
            case 'Blue': return 'hue-rotate(240deg) brightness(1) saturate(1)';
            case 'Purple': return 'hue-rotate(270deg) brightness(1) saturate(1)';
            case 'Black': return 'brightness(0) saturate(1)';
            case 'Brown': return 'hue-rotate(45deg) brightness(0.7) saturate(1)';
            case 'Violet': return 'hue-rotate(280deg) brightness(1) saturate(1)';
            case 'Lavender': return 'hue-rotate(290deg) brightness(1) saturate(1)';
            case 'Pink': return 'hue-rotate(330deg) brightness(1) saturate(1)';
            case 'Grey': return 'brightness(0.5) saturate(0)';
            case 'Teal': return 'hue-rotate(180deg) brightness(1) saturate(1)';
            case 'Cyan': return 'hue-rotate(190deg) brightness(1) saturate(1)';
            case 'Magenta': return 'hue-rotate(300deg) brightness(1) saturate(1)';
            case 'Olive': return 'hue-rotate(90deg) brightness(0.6) saturate(1)';
            case 'Turquoise': return 'hue-rotate(170deg) brightness(1) saturate(1)';
            case 'Silver': return 'brightness(0.75) saturate(0)';
            case 'Gold': return 'hue-rotate(50deg) brightness(1) saturate(1)';
            case 'Peach': return 'hue-rotate(20deg) brightness(1) saturate(1)';
            case 'Navy': return 'hue-rotate(240deg) brightness(0.5) saturate(1)';
            case 'Maroon': return 'hue-rotate(0deg) brightness(0.5) saturate(1)';
            case 'Beige': return 'hue-rotate(40deg) brightness(0.9) saturate(0.7)';
            case 'Mint': return 'hue-rotate(150deg) brightness(1.1) saturate(1)';
            case 'Coral': return 'hue-rotate(15deg) brightness(1) saturate(1.1)';
            case 'Indigo': return 'hue-rotate(250deg) brightness(0.8) saturate(1)';
            case 'Chartreuse': return 'hue-rotate(80deg) brightness(1) saturate(1)';
            case 'Crimson': return 'hue-rotate(-10deg) brightness(0.9) saturate(1)';
            case 'Salmon': return 'hue-rotate(10deg) brightness(1) saturate(1)';
            case 'Khaki': return 'hue-rotate(40deg) brightness(0.8) saturate(0.8)';
            case 'Plum': return 'hue-rotate(270deg) brightness(0.8) saturate(0.9)';
            case 'Azure': return 'hue-rotate(210deg) brightness(1) saturate(1)';
            case 'LavenderBlush': return 'hue-rotate(320deg) brightness(1) saturate(1.2)';
            case 'Sienna': return 'hue-rotate(30deg) brightness(0.6) saturate(1)';
            case 'Periwinkle': return 'hue-rotate(240deg) brightness(1.1) saturate(0.8)';
            case 'Lime': return 'hue-rotate(90deg) brightness(1.2) saturate(1)';
            case 'Ivory': return 'brightness(1.2) saturate(0.5)';
            case 'Rose': return 'hue-rotate(340deg) brightness(1) saturate(1)';
            case 'Sand': return 'hue-rotate(40deg) brightness(1) saturate(0.7)';
            case 'Emerald': return 'hue-rotate(120deg) brightness(1.1) saturate(1)';
            default: return 'hue-rotate(0deg) brightness(1) saturate(1)';
        }
    }
    toggleDropdown() {
   
        this.deleteinputbin = !this.deleteinputbin;
        if(this.deleteinputbin){
          this.focusInputDeleteField()
        }
        else{
          this.focusInputField()
        }
    }
    GetDetails() { 
        console.log('GetDetails');
        this.apiservice?.GetGrnList().subscribe(
            (res: any) => {
                if (res && res.status === 1) {
                    this.grnlist = res.data;  // Store data from the API to grnlist
                    this.remarkslist = res.remarks;  // Store remarks from the API to remarkslist
                } else {
                    this.presentAlert(res.message, '');
                }
            },
            (error: any) => {
                this.presentAlert(error.message, ''); // Handle network or server error here
            }
        );
    }
    
    
    
    
    

    refreshgrn() {
        console.log('refreshgrn');
        localStorage.removeItem('selectedGrnNo');
        this.camSet = 0;
        this.remarkslist = [];
        this.isGrnSelected = false;
        this.selectedGrnNo = false;
        this.scanbinicon = false;
        this.binIdSelectvalue = null;
        this.binIdSelect = null;
        this.selectedBinIds = [];
        this.binIdselect1 = null;
        this.scanbin = false;
        this.binQty = 0;

        this.visible_item = false;
        this.maxValidate = 0;
        this.maxLimit = 0;
        this.qty=0;
        this.scannedArray = [];  // check this
        this.tempArray = [];
        this.qntyCnt = 0;
        this.distinctArray = []; // check this
        this.isModalOpen = false;
        this.getdeleteitem = null;
        this.remark = null;
        this.deleteinputbin = false;
        this.quantity = 0;
        this.itemCompleteArray = [];
        this.isInputFilled = false;
        this.isGrnSelected = false;
        this.itemDetails = false
      
        console.log('refreshgrn hhjjuko;');
        this.camFlag = false;

        if (this.inputField) {
            console.log('refreshgrn hhjjuko1;');
            this.inputField.nativeElement= '';
        }

        if (this.inputdeleteField) {
            console.log('refreshgrn hhjjuko2;');
            this.inputdeleteField.nativeElement.value = '';
        }

        if (this.grnSelect) {
            console.log('refreshgrn hhjjuko3;');
            this.grnSelect.nativeElement.value = '';
        }
        if (this.selectElement) {
            console.log('refreshgrn hhjjuko4;');
            this.selectElement.value = ''; // Clear the dropdown selection
            this.selectElement.disabled = false; // Enable the select ele   ment
        }


        // Additional reset logic if necessary
    }
    itemcomplete(itemcod:any,itemqty: any, totalqty: any) {
        console.log(itemcod, itemqty, totalqty)

        console.log('Total Scanner ', this.scannedArray)
        console.log('Item Code ', itemcod);

        console.log('my scanned array results : ', this.scannedArray)
        // this.itemexistflag = this.scannedArray.some(item => item.ItemCode === itemcod);
        // console.log('ItemCode : AMSKR38H', isItemCodeExist)
        
        if (this.getRemarks) {
            this.presentAlertScan(itemcod)
        }
        else 
        {

          this.itemComplete(itemcod);
        }
    }

// cam scanner
decText: any[] = [] 
isCameraOpen: boolean = false;
opencameramodal=false
openCam(type:string): void {
  this.camSet = 1;
  this.camFlag = true;
  
  //this.indexCalc = 1;
  const reader = document.getElementById('reader');
  const arrange = document.getElementById('arrange');

  if (reader) 
  {
      reader.style.display = 'block';
  }
  if (arrange) 
  {
      arrange.style.display = 'grid';
  }
  
  this.html5Qrcode = new Html5Qrcode('reader');
          
  const qrCodeSuccessCallback = (decodedText: string, decodedResult: Html5QrcodeResult) => {
      const showElement = document.getElementById('show');
      const resultElement = document.getElementById('result');
      const arrange = document.getElementById('arrange');
          
          this.decText.push(decodedResult);
          if(type=='add')
          {
              if (this.inputField) {
                  this.inputField.nativeElement.value = decodedText;
                  setTimeout(() => {
                      const event = new Event('keyup');
                      Object.assign(event, { key: 'Enter', keyCode: 13, which: 13 });
                      this.inputField.nativeElement.dispatchEvent(event);
                  }, 0);

                  // const inputField = this.inputField.nativeElement;
                  // this.SelectBinId({ target: { value: decodedText } }, inputField);
              }
          }
          else if(type=='delete')
          {
              if (this.inputdeleteField) {
                  this.inputdeleteField.nativeElement.value = decodedText;
                    setTimeout(() => {
                        const event = new Event('keyup');
                        Object.assign(event, { key: 'Enter', keyCode: 13, which: 13 });
                        this.inputdeleteField.nativeElement.dispatchEvent(event);
                    }, 0);

                  // const inputdeleteField = this.inputdeleteField.nativeElement;
                  // this.ScanItemDelete({ target: { value: decodedText } }, inputdeleteField);
              }
          }
          
            if(decodedResult)
            {
                this.stopCam();
                if (arrange) {
                    arrange.style.display = 'none'
                    arrange.style.backgroundColor = 'transparent';
                    this.closeModal();
                }
            }

            if (showElement && resultElement) 
            {
                showElement.style.display = 'none';
                resultElement.textContent = (decodedText);
                this.closeModal();
                this.html5Qrcode?.stop().then(() => {
                    console.log("QR Code scanning stopped.");
                }).catch((err) => {
                    console.error("Failed to stop scanning: ", err);
                });
            }
  };

  const qrCodeErrorCallback = (errorMessage: string, error: Html5QrcodeError) => {
      // Log the error message
      // console.error(QR code parse error: ${errorMessage});
      // Continue scanning without interruption
  };
  
  const config = { fps: 10, qrbox: { width: 250, height: 250 } };

  this.html5Qrcode.start(
      { facingMode: "environment" },
      config,
      qrCodeSuccessCallback,
      qrCodeErrorCallback
  ).then(() => {
      const trackSettings = this.html5Qrcode?.getRunningTrackSettings();
      if (trackSettings && 'torch' in trackSettings) {
        this.html5Qrcode?.applyVideoConstraints({ advanced: [{ torch: true }] as any }).then(() => {
          }).catch((err) => {
              console.error("Failed to turn on flashlight: ", err);
          });
      } else {
          console.log("Torch is not supported on this device.");
      }
  }).catch((err) => {
      this.presentAlert(err.message, '')
  });
}

stopCam(): void {
    if (this.html5Qrcode) {
      // Turn off the torch if it was enabled
      const trackSettings = this.html5Qrcode.getRunningTrackSettings();
      if (trackSettings && 'torch' in trackSettings) {
        this.html5Qrcode?.applyVideoConstraints({ advanced: [{ torch: false }] as any }).then(() => {
          console.log("Torch turned off.");
        }).catch((err) => {
          console.error("Failed to turn off flashlight: ", err);
        });
      }
  
      this.html5Qrcode.stop().then(() => {
        const reader = document.getElementById('reader');
        if (reader) {
          reader.style.display = 'none';
        }
        this.camFlag = false;
      }).catch((err) => {
        console.error("Failed to stop scanning: ", err);
      });
    }
  }
  

ShowViewDetailsShowCamera(isOpen: boolean) {
  this.isModalOpen = isOpen;
}

//decText: Html5QrcodeResult[] = [];
openModal(type: string) {
  this.isModalOpen = true;
  setTimeout(() => this.startScanner(type), 100); // Delay to ensure modal is fully opened
}

closeModal() {
    this.closeModal1();
  this.isModalOpen = false;
  this.stopScanner();
}

startScanner(type: string) {
  const reader = document.getElementById('reader');
  const arrange = document.getElementById('arrange');

  if (reader) {
    reader.style.display = 'block';
  }
  if (arrange) {
    arrange.style.display = 'grid';
  }

  this.html5Qrcode = new Html5Qrcode('reader');

  const qrCodeSuccessCallback = (decodedText: string, decodedResult: Html5QrcodeResult) => {
    const showElement = document.getElementById('show');
    const resultElement = document.getElementById('result');
       
    this.decText.push(decodedResult);    
    if (type === 'add') {
      if (this.inputField) {
        this.inputField.nativeElement.value = decodedText;
        setTimeout(() => {
          const event = new Event('keyup');
          Object.assign(event, { key: 'Enter', keyCode: 13, which: 13 });
          this.inputField.nativeElement.dispatchEvent(event);
        }, 0);
      }
    } else if (type === 'delete') {
      if (this.inputdeleteField) {
        this.inputdeleteField.nativeElement.value = decodedText;
        setTimeout(() => {
          const event = new Event('keyup');
          Object.assign(event, { key: 'Enter', keyCode: 13, which: 13 });
          this.inputdeleteField.nativeElement.dispatchEvent(event);
        }, 0);
      }
    }
       
    if (decodedResult) {
      this.closeModal();
    }

    if (showElement && resultElement) {
      showElement.style.display = 'none';
      resultElement.textContent = decodedText;
      this.html5Qrcode?.stop().then(() => {
        console.log("QR Code scanning stopped.");
      }).catch((err) => {
        console.error("Failed to stop scanning: ", err);
      });
    }
  };

  const qrCodeErrorCallback = (errorMessage: string) => {
    console.error(`QR code parse error: ${errorMessage}`);
  };

  const config = { fps: 10, qrbox: { width: 250, height: 250 } };

  this.html5Qrcode.start(
    { facingMode: "environment" },
    config,
    qrCodeSuccessCallback,
    qrCodeErrorCallback
  ).then(() => {
    console.log("QR Code scanning started.");
  }).catch((err) => {
    console.error("Failed to start scanning: ", err);
  });
}

stopScanner() {
  if (this.html5Qrcode) {
    this.html5Qrcode.stop().then(() => {
      console.log("QR Code scanning stopped.");
      const reader = document.getElementById('reader');
      if (reader) {
        reader.style.display = 'none';
      }
    }).catch((err) => {
      console.error("Failed to stop scanning: ", err);
    });
  }
}
    
    public alertPresentButtons = [
        {
          text: 'OK',
          cssClass: 'alert-button-confirm',
          handler: () => {
            const modalElement = this.scanModal.nativeElement;
            modalElement.style.display = 'none'; // Hide the modal
            modalElement.classList.remove('show'); // Remove Bootstrap 'show' class
            modalElement.setAttribute('aria-hidden', 'true'); // Reset accessibility attributes
            modalElement.removeAttribute('aria-modal');
            document.body.classList.remove('modal-open');
            if(this.inputField){
                this.inputField.nativeElement=''
            }
            if(this.inputdeleteField){
                this.inputdeleteField.nativeElement=''
            }
            // this.inputField.nativeElement = '';
            // this.inputdeleteField.nativeElement=''
          }
        }
    ]

    async presentAlert(msg: any, color: any) {
        const alert = await this.alertController.create({
            header: msg,
            buttons: this.alertPresentButtons,
            cssClass: 'custom-alert'
        });

        await alert.present();
    }

    public alertItemPresent = [
        {
            text: 'OK',
            cssClass: 'alert-button-confirm',
            handler: () => {
                const modalElement = this.scanModal.nativeElement;
                modalElement.style.display = 'none'; // Hide the modal
                modalElement.classList.remove('show'); // Remove Bootstrap 'show' class
                modalElement.setAttribute('aria-hidden', 'true'); // Reset accessibility attributes
                modalElement.removeAttribute('aria-modal');
                document.body.classList.remove('modal-open');
                this.focusInputField();
                // this.disableitemcode=true;// Reset binId to 0 
            }
        },
    ];

    async itempresent(Header:any, SubHeader:any) 
    {
        const alert = await this.alertController.create({
            header: Header, 
            subHeader: SubHeader, 
            buttons: this.alertItemPresent,
            cssClass: 'custom-alert'
        })
        await alert.present();
    }

    public alertItemnotdelete = [
        {
            text: 'OK',
            cssClass: 'alert-button-confirm',
            handler: () => {
                this.focusInputDeleteField();
                this.modalclose();
                // this.disableitemcode=true;// Reset binId to 0 
            }
        },
    ]

    async itemnotdelete() 
    {
        const alert = await this.alertController.create({
        header: 'ITEM NOT FOUND', 
        // subHeader: 'COMPLETE THE BIN', 
        buttons: this.alertItemnotdelete,
        cssClass: 'custom-alert'
        });

        await alert.present();
    }

    public alertBinScan = [
        {
            text: 'OK',
            cssClass: 'alert-button-confirm',
            handler: () => {
                const inputElement = document.getElementById('ip') as HTMLInputElement;
                inputElement.placeholder = 'Scan Bin Id';
                this.focusInputField()
                this.modalclose();
                // this.disableitemcode=true;// Reset binId to 0 
            }
        },
    ]

    async binscan() 
    {
        const alert = await this.alertController.create({
            header: 'BIN NOT SCANNED',  
            buttons: this.alertBinScan,
            cssClass: 'custom-alert'
        });

        await alert.present();
    }

    async completeBinSuccess() {
        const alert = await this.alertController.create({
            header: 'Complete Bin Successful',
            buttons: this.binsuccess,
            cssClass: 'custom-alert'
        });

        await alert.present();
    }
    
    public binsuccess = [
        {
        text: 'OK',
        cssClass: 'alert-button-confirm',
        handler: () => {
            this.focusInputField()
            this.scanbinicon = false
            this.modalclose();
        }
        },
    ];

    public compbinealert = [
        {
            text: 'OK',
            cssClass: 'alert-button-confirm',
            handler: () => {
                this.modalclose();
                this.focusInputField()
                this.qty=0
            }
        },
    ]
    
    public alertButtonscompletebin = [
        {
            text: 'Yes',
            cssClass: 'alert-button-inline',
            handler: () => { 
                if(this.scannedArray.length > 0)
                {
                    this.btnitemcomp=true;
                }
                this.focusInputField();
                const filteredData = this.scannedArray.filter(item => item.BinID === this.binIdselect1);
        
                // Group by ItemCode and calculate the quantity
                const groupedData = filteredData.reduce((acc, item) => {
                    if (!acc[item.ItemCode]) {
                        acc[item.ItemCode] = { ...item, Quantity: 0 };
                    }
                    acc[item.ItemCode].Quantity += 1;
                    return acc;
                }, {} as { [key: string]: any });
        
                // Convert grouped data back to array
                const result = Object.values(groupedData);
        
                let resultantArray = result.map((item: any) => {
                    return {
                        BinID: item.BinID,
                        DocNO: item.DocNO,
                        GRNNo: item.GRNNo,
                        ItemCode: item.ItemCode,
                        ItemGroup: item.ItemGroup,
                        ItemName: item.ItemName,
                        Quantity: item.Quantity
                    };
                });
                this.loadingService.presentLoading();
                this.apiservice.CompleteGRN({ data: resultantArray }).subscribe(
                  (res: any) => {
                      this.loadingService.dismissLoading();
                      if (res.Status == 1) {
                          this.presentAlert('BIN COMPLETE SUCCESS', '');
                          this.selectedBinIds=[]
                          this.binIdSelect = '';    
                          this.scanbin = false;
                      this.maxValidate = 0;
                      this.binIdselect1 = '';
                      const inputElement = document.getElementById('ip') as HTMLInputElement;
                      inputElement.placeholder = 'Scan Bin Id';
                      this.binIdSelect = '';    
                      this.scanbin = false;
                      this.maxLimit=this.grndataArr[0].BinCapacity;
                      this.qty=0;

                          return;
                      }
                      else if (res.status == 0) {
                          this.presentAlert(res.message, '');
                          return
                      }
              
                      // Code below will only execute if res.Status is not 0
                      this.maxValidate = 0;
                      this.selectedBinIds = [];
                      this.binIdselect1 = '';
                      const inputElement = document.getElementById('ip') as HTMLInputElement;
                      inputElement.placeholder = 'Scan Bin Id';
                      this.binIdSelect = '';    
                      this.scanbin = false;
                  },
                  (error: any) => {
                      this.loadingService.dismissLoading();
                      this.presentAlert(error.message, '');
                      // Additional error handling logic if needed
                  }
              );
              
            }
        },
        {
          text: 'No',
          cssClass: 'alert-button-inline',
          handler: () => {
              this.focusInputField();
          }
      }

    ]

    public alertButtonsrefresh = [

        {
            text: 'Yes',
            cssClass: 'alert-button-inline',
            handler: () => {
                this.refreshgrn();
            }
        },
        {
          text: 'No',
          cssClass: 'alert-button-inline',
          handler: () => {
              this.focusInputField();
          }
      }
    ];

    public itemcomp = [

      {
          text: 'Yes',
          cssClass: 'alert-button-inline',
          handler: () => {
              this.refreshgrn();
          }
      },
      {
        text: 'No',
        cssClass: 'alert-button-inline',
        handler: () => {
            this.focusInputField();
        }
    }
  ];

  completeItemApi(itemcod: string) {
    let obj = { GRNNo: this.selectedGrnNo, ItemCode: itemcod, remarks: '' };
    this.loadingService.presentLoading();
    this.apiservice.completeItem({ data: obj }).subscribe({
        next: (res: any) => {
            this.loadingService.dismissLoading();
            if (res.Status == 1) {
                this.btnenabled = false;
                this.presentAlert('ITEM COMPLETED SUCCESSFULLY', '');
                this.itemCompleteArray = [];
                this.GetGrnNumberDetails(this.selectedGrnNo);
            } else if (res.Status == 0) {
                this.presentAlert(res.message, '');
            }
        },
        error: (err: any) => {
            this.loadingService.dismissLoading();
            this.presentAlert('ITEM COMPLETE FAILED', '');
        }
    });
}


modalclose(){
     const modalElement = this.scanModal.nativeElement;
            modalElement.style.display = 'none'; // Hide the modal
            modalElement.classList.remove('show'); // Remove Bootstrap 'show' class
            modalElement.setAttribute('aria-hidden', 'true'); // Reset accessibility attributes
            modalElement.removeAttribute('aria-modal');
            document.body.classList.remove('modal-open');
}
  async itemComplete(itemcod: string) {
    const alert = await this.alertController.create({
        header: 'DO YOU WANT TO COMPLETE THE ITEM?',
        buttons: [
            {
                text: 'Yes',
                cssClass: 'alert-button-inline',
                handler: () => {
                    this.completeItemApi(itemcod);  // Call a function to handle the API call
                }
            },
            {
                text: 'No',
                cssClass: 'alert-button-inline',
                handler: () => {
                    this.focusInputField();
                }
            }
        ],
        cssClass: 'custom-alert'
    });
    await alert.present();
}

    async presentAlertScan(itemCode: any): Promise<void> {
        const remarksList = this.remarkslist.map((data: { ReasonDescription: any; }) => `<option value="${data.ReasonDescription}">${data.ReasonDescription}</option>`).join('');
    
        const alert = await this.alertController.create({
            header: 'Are you sure to complete the item?',

            subHeader: 'Scanned less than Total Quantity',
            message: `
                <div>
                <label for="remarkSelect">Select Remark:</label>
                <select id="remarkSelect" class="custom-dropdown">
                    ${remarksList}
                </select>
                </div>
            `,
            buttons: [
                {
                    text: 'YES',
                    cssClass: 'alert-button-inline',
                    handler: () => {
                        const selectElement = document.getElementById('remarkSelect') as HTMLSelectElement;
                        this.remark = selectElement.value;
                        let obj = { GRNNo: this.selectedGrnNo, ItemCode: itemCode, remarks: this.remark };
                        this.loadingService.presentLoading();
                        this.apiservice.completeItem({ data: obj }).subscribe((res: any) => {
                            this.loadingService.dismissLoading();
                            if(res.Status == '1'){
                                this.btnenabled = false;
                                this.presentAlert('ITEM COMPLETED SUCCESSFULLY', '');
                            this.itemCompleteArray = [];
                            }
                            else if(res.Status === '0'){
                                // this.itempresent('ITEM COMPLETE FAILED', '');
                            this.presentAlert('ITEM COMPLETE FAILED', '');
                            }
                        });
                        this.modalclose();
                    }
                },
                {
                  text: 'NO',
                  role: 'cancel',
                  cssClass: 'alert-button-inline',
                  handler: () => {
                      this.focusInputField();
                  }
              }
            ],
            cssClass: 'custom-alert'
        });
    
        await alert.present();
    }

    public alertButtonsDelete: any[] = [
        {
            text: 'Yes',
            cssClass: 'alert-button-confirm',
            handler: () => {
                this.focusInputDeleteField()
                this.confirmDeleteCallback();
                this.modalclose();
            },
        },
        {
          text: 'No',
          cssClass: 'alert-button-confirm',
          role: 'cancel',
      }
    ]
    private confirmDeleteCallback!: () => void;
    async DeleteAlert(callback: () => void) {
        this.confirmDeleteCallback = callback;
        const alert = await this.alertController.create({
            header: 'ARE YOU SURE TO DELETE ALL?',
            buttons: this.alertButtonsDelete,
            cssClass: 'custom-alert'
        });

        await alert.present();
    }

    scrollUp() {
      const content = this.scrollContent.nativeElement;
      content.scrollBy({ top: -100000000, behavior: 'smooth' });
    }

    scrollUp1() {
        console.log('scroll up');
        const content1 = this.scrollContent1.nativeElement;

        content1.scrollBy({ top: -10000000, behavior: 'smooth' });
      }
  
    scrollDown() {
      const content = this.scrollContent.nativeElement;
      content.scrollBy({ top: 10000, behavior: 'smooth' });
    }

  openModalAndCam(type: string): void {
   // this.isModalOpen = true;
    this.openModal1(); // Open the modal
    this.openCam(type); // Start the camera
  }

  openModal1(): void {
    const modalElement = this.scanModal.nativeElement;
    modalElement.style.display = 'block'; // Show the modal
    modalElement.classList.add('show'); // Add Bootstrap 'show' class for display
    modalElement.setAttribute('aria-hidden', 'false'); // Ensure accessibility attributes are correctly set
    modalElement.setAttribute('aria-modal', 'true');
    document.body.classList.add('modal-open'); // Prevent body scroll when modal is open
  }

  closeModal1(): void {
    //this.stopCam();
    this.stopScanner();
    const modalElement = this.scanModal.nativeElement;
    modalElement.style.display = 'none'; // Hide the modal
    modalElement.classList.remove('show'); // Remove Bootstrap 'show' class
    modalElement.setAttribute('aria-hidden', 'true'); // Reset accessibility attributes
    modalElement.removeAttribute('aria-modal');
    document.body.classList.remove('modal-open'); // Allow body scroll again
  }
}






