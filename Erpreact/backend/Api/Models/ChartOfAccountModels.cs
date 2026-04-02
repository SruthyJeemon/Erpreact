using System;

namespace Api.Models
{
    public class ChartOfAccountData
    {
        public int Id { get; set; }
        public string Account_typeid { get; set; }
        public string Detail_typeid { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string Currency { get; set; }
        public string Is_subaccount { get; set; }
        public string Subnameid { get; set; }
        public string Vatcode { get; set; }
        public string Balance { get; set; }
        public string Asof { get; set; }
        public string Type { get; set; }
        public string Isdelete { get; set; }
        public string Status { get; set; }
        
        // Joined fields
        public string Acc_type { get; set; }
        public string Detail_type { get; set; }
    }

    public class ChartOfAccountRequest
    {
        public int Id { get; set; }
        public string Account_typeid { get; set; }
        public string Detail_typeid { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string Currency { get; set; }
        public string Is_subaccount { get; set; }
        public string Subnameid { get; set; }
        public string Vatcode { get; set; }
        public string Balance { get; set; }
        public string Asof { get; set; }
        public string Type { get; set; }
        public string Isdelete { get; set; }
        public string Status { get; set; }
        public int Query { get; set; }
    }

    public class ChartOfAccountResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public List<ChartOfAccountData> Data { get; set; }
    }

    public class AccountTypeData
    {
        public int Id { get; set; }
        public string Acc_type { get; set; }
        public string Is_cd { get; set; }
        public string Isdelete { get; set; }
        public string Status { get; set; }
    }

    public class AccountTypeResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public List<AccountTypeData> Data { get; set; }
    }

    public class AccountDetailTypeData
    {
        public int Id { get; set; }
        public int Acc_typeid { get; set; }
        public string Detail_type { get; set; }
        public string Description { get; set; }
        public string Isdelete { get; set; }
        public string Status { get; set; }
    }

    public class AccountDetailTypeResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public List<AccountDetailTypeData> Data { get; set; }
    }
}
