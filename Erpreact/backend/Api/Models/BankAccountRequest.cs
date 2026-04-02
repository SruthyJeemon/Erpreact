namespace Api.Models;

public class BankAccountRequest
{
    public int? Id { get; set; }
    public string? Accountname { get; set; }
    public string? Account_number { get; set; }
    public string? IBAN { get; set; }
    public string? Bankname { get; set; }
    public string? Swift_code { get; set; }
    public string? Isdelete { get; set; }
    public string? Ca_id { get; set; }
    public int Query { get; set; } // 1=Insert, 2=Update, 3=Select All, 4=Soft Delete, 5=Select Account_number by Ca_id
}
