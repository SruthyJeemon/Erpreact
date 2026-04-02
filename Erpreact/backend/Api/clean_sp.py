import os

file_path = r'z:\Sruthy\Erpreact\Erpreact\backend\Api\Sp_Stocktransfer_backup.sql'
out_path = r'z:\Sruthy\Erpreact\Erpreact\backend\Api\Sp_Stocktransfer_update.sql'

with open(file_path, 'r') as f:
    lines = f.readlines()

# Remove headers
# Skip until 'CREATE PROCEDURE' or similar
start_index = 0
for i, line in enumerate(lines):
    if 'CREATE PROCEDURE' in line:
        start_index = i
        break

cleaned_lines = lines[start_index:]

# Replace CREATE with ALTER
if cleaned_lines:
    cleaned_lines[0] = cleaned_lines[0].replace('CREATE PROCEDURE', 'ALTER PROCEDURE')

# Locate the last END and insert Query 28 before it
# The content has many spaces due to column formatting in sqlcmd
content = "".join(cleaned_lines)

# Strip trailing spaces from each line for better readability
lines_stripped = [line.rstrip() + '\n' for line in cleaned_lines]
content = "".join(lines_stripped)

# Find the very last END
insert_pos = content.rfind('END')
if insert_pos != -1:
    query_28 = """
 if(@Query = 28)
 BEGIN
 SELECT 
    ts.*, 
    tr.Firstname, 
    tsl.Name AS WarehouseFromName, 
    tsll.Name AS WarehouseToName
 FROM Tbl_Stocktransfer ts
 INNER JOIN Tbl_Registration tr ON tr.Userid = ts.Userid
 INNER JOIN Tbl_Stocklocation tsl ON tsl.Id = ts.Warehousefrom
 INNER JOIN Tbl_Stocklocation tsll ON tsll.Id = ts.Warehouseto
 WHERE ts.Isdelete = 0 
    AND tr.Catelogid IN (SELECT value FROM dbo.SplitString(@Catelogid, ','))
    AND CAST(TRY_CONVERT(DATETIME, LTRIM(RTRIM(ts.Date)), 103) AS DATE) BETWEEN 
        CAST(@fromdate AS DATE) AND CAST(@todate AS DATE)
    AND (@Receiptno IS NULL OR @Receiptno = '' OR ts.Receiptno LIKE '%' + @Receiptno + '%')
    AND ts.Towarehouse_approve = @Towarehouse_approve
 ORDER BY ts.Id DESC;
 END
"""
    final_content = content[:insert_pos] + query_28 + content[insert_pos:]
    with open(out_path, 'w') as f:
        f.write(final_content)
    print("Successfully created Sp_Stocktransfer_update.sql")
else:
    print("Could not find suitable insertion point")
