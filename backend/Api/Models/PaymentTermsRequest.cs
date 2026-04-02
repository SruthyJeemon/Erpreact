namespace Api.Models;

public class PaymentTermsRequest
{
    public int? Id { get; set; }
    public string? Paymentterms { get; set; }
    public string? Isdelete { get; set; }
    public int Query { get; set; } // 1=Insert, 2=Update, 3=UpdateIsdelete, 4=SelectAll
}
