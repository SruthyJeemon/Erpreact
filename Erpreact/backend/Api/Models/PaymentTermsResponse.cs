namespace Api.Models;

public class PaymentTermsResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<PaymentTermsData>? PaymentTerms { get; set; }
    public List<PaymentTermsData>? Data { get; set; } // Alternative property name for compatibility
}

public class PaymentTermsData
{
    public int Id { get; set; }
    public string? Paymentterms { get; set; }
    public string? Isdelete { get; set; }
}
