namespace Api.Models;

public class BankAccountResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<BankAccountData>? BankAccounts { get; set; }
    public List<BankAccountData>? Data { get; set; } // Alternative property name for compatibility
    public string? Account_number { get; set; } // For Query = 5 (Select Account_number by Ca_id)
}

public class BankAccountData
{
    public int Id { get; set; }
    public string? Accountname { get; set; }
    public string? Account_number { get; set; }
    public string? IBAN { get; set; }
    public string? Bankname { get; set; }
    public string? Swift_code { get; set; }
    public string? Isdelete { get; set; }
    public string? Ca_id { get; set; }
}
