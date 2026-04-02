using System;
using System.Collections.Generic;

namespace Api.Models
{
    public class StockTransferModels
    {
        public StockTransferFormData? FormData { get; set; }
        public List<StockTransferDetailItem>? TableData1 { get; set; }
    }

    public class StockTransferFormData
    {
        public int Id { get; set; }
        public string? Warehousefrom { get; set; }
        public string? Warehouseto { get; set; }
        public string? locationaddress { get; set; }
        public DateTime? Sheduleddate { get; set; }
        public string? Remarks { get; set; }
        public string? Userid { get; set; }
    }

    public class StockTransferDetailItem
    {
        public int Itemid { get; set; }
        public string? Itemname { get; set; }
        public int Qty { get; set; }
    }

    public class StockApprovalRequest
    {
        public string? Id { get; set; }
        public string? Comments { get; set; }
        public string? Status { get; set; }
        public string? invoiceId { get; set; }
        public string? pdfData { get; set; } // Base64 string
        public string? Userid { get; set; }
    }

     public class Stocktransfer
     {
         public string? Id { get; set; }
         public string? Userid { get; set; }
         public string? username { get; set; }
         public string? WarehouseFromName { get; set; }
         public string? WarehouseToName { get; set; }
         public string? locationaddress { get; set; }
         public string? Warehousefrom { get; set; }
         public string? Warehouseto { get; set; }
         public string? Date { get; set; }
         public string? Receiptno { get; set; }
         public string? Sheduleddate { get; set; }
         public string? Managerapprove { get; set; }
         public string? Deliverynote { get; set; }
         public string? Transfer_invoice { get; set; }
         public string? Finalinvoice { get; set; }
         public string? WarehouseFromAddress { get; set; }
         public string? WarehouseToAddress { get; set; }
         public string? Pickupid { get; set; }
         public string? Stocktransferid { get; set; }
         public string? Status { get; set; }
         public string? Comments { get; set; }
         public string? Approveuserid { get; set; }
     }

     public class Stocktransferdetails
     {
         public string? Itemid { get; set; }
         public string? Type { get; set; }
         public string? Receivedqty { get; set; }
     }

     public class StockTransferFinalApprovalRequest
     {
         public Stocktransfer? formData { get; set; }
         public List<Stocktransferdetails>? tableData1 { get; set; }
     }

     public class AcceptDisputeRequest
     {
         public string? Stockid { get; set; }
         public string? Pickuplistid { get; set; }
         public string? Userid { get; set; }
     }
 }



