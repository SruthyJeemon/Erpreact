using System.Globalization;

namespace Api;

/// <summary>
/// Tbl_Salesbill.Terms and Salespersonname must be a single numeric id for Sp_Salesbill Q4 (joins to Tbl_Paymentterms / Tbl_Salesperson).
/// Customer or registration fields sometimes carry comma-separated ids (e.g. Catelogid-style "9,4,10,6") and must not be persisted as-is.
/// Sp_InsertTransaction expects @Catelogid INT — same parsing applies.
/// </summary>
internal static class SalesBillPayloadSanitizer
{
    public static string? FirstIntToken(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        var t = raw.Trim();
        if (int.TryParse(t, NumberStyles.Integer, CultureInfo.InvariantCulture, out _))
            return t;
        foreach (var part in t.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries))
        {
            var p = part.Trim();
            if (int.TryParse(p, NumberStyles.Integer, CultureInfo.InvariantCulture, out _))
                return p;
        }
        return null;
    }

    public static object TermsForSp(string? terms) =>
        FirstIntToken(terms) is { } x ? x : DBNull.Value;

    public static object SalespersonForSp(string? salesperson) =>
        FirstIntToken(salesperson) is { } x ? x : DBNull.Value;

    public static int CatalogIdIntForInsertTransaction(string? catelogRaw)
    {
        if (FirstIntToken(catelogRaw) is { } s && int.TryParse(s, NumberStyles.Integer, CultureInfo.InvariantCulture, out var n))
            return n;
        return 1;
    }
}
