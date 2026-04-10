import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton,
  CircularProgress,
  InputAdornment,
  Stack,
  Tooltip,
  Breadcrumbs,
  Link
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { DataGrid } from '@mui/x-data-grid';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

const ComboEditRequestSection = ({ onNavigate }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({ commentId: '', status: '', comments: '' });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));

  const catelogid = useMemo(() => String(user.Catelogid || user.catelogid || '').trim(), [user]);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        pageSize: String(itemsPerPage),
        search: searchTerm || '',
        catelogid: catelogid || ''
      });
      const res = await fetch(`${API_URL}/api/combo/edit-requests/pending?${params}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success !== false) {
        setItems(Array.isArray(data.data) ? data.data : []);
        setTotalCount(Number(data.totalCount || 0));
      } else {
        setItems([]);
        setTotalCount(0);
      }
    } catch (e) {
      console.error('Error fetching combo edit requests:', e);
      setMessage({ type: 'error', text: 'Failed to load combo edit requests.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, searchTerm, catelogid]);

  const openModal = (row, status) => {
    setModalData({
      commentId: String(row.CommentId || row.commentId || row.Id || ''),
      status,
      comments: ''
    });
    setShowModal(true);
  };

  const submitDecision = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/combo/edit-requests/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          CommentId: Number(modalData.commentId),
          Status: modalData.status,
          Comments: modalData.comments || '',
          Approved_Userid: String(user.Userid || user.userid || user.id || user.Id || '')
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success !== false) {
        setMessage({ type: 'success', text: data.message || 'Response successfully saved' });
        setShowModal(false);
        fetchPending();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Action failed.' });
      }
    } catch (e) {
      console.error('Error saving combo edit request response:', e);
      setMessage({ type: 'error', text: 'Error saving response.' });
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4, lg: 5 }, bgcolor: '#f1f5f9', minHeight: '100vh' }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 4, md: 5 },
          borderRadius: { xs: 0, md: 5 },
          bgcolor: 'white',
          border: '1px solid #e2e8f0',
          borderTop: '6px solid #3b82f6',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.02), 0 4px 6px -2px rgba(0,0,0,0.01)',
          width: '100% !important'
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 3, mb: 4 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em', mb: 0.5 }}>
              Combo Edit Requests
            </Typography>
            <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ color: '#64748b' }}>
              <Link underline="hover" color="inherit" onClick={() => navigate('/')} sx={{ cursor: 'pointer', fontWeight: 600 }}>Dashboard</Link>
              <Typography color="text.primary" sx={{ fontWeight: 700 }}>Approvals</Typography>
            </Breadcrumbs>
          </Box>
          <Button
            variant="outlined"
            onClick={onNavigate}
            startIcon={<ArrowBackIcon />}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              px: 3,
              height: 42,
              borderColor: '#e2e8f0',
              color: '#475569',
              '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' },
              textTransform: 'none'
            }}
          >
            Back to Approvals
          </Button>
        </Box>

        {message.text && (
          <Alert severity={message.type === 'error' ? 'error' : 'success'} sx={{ mb: 3, borderRadius: 2 }}>
            {message.text}
          </Alert>
        )}

        <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 2, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, gap: 2 }}>
          <Stack direction="row" spacing={1.5} sx={{ width: { xs: '100%', md: 'auto' } }}>
            <TextField
              size="small"
              placeholder="Search by combo, id, user, comment..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#94a3b8' }} /></InputAdornment> }}
              sx={{ width: { xs: '100%', sm: 360 } }}
            />
            <Tooltip title="Refresh List">
              <IconButton onClick={fetchPending} sx={{ border: '1px solid #e2e8f0' }}><RefreshIcon /></IconButton>
            </Tooltip>
          </Stack>
          <Typography variant="subtitle2" sx={{ color: '#64748b' }}>
            Pending Requests: <Typography component="span" sx={{ fontWeight: 800, color: '#2563eb' }}>{totalCount}</Typography>
          </Typography>
        </Paper>

        <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'auto' }}>
          <Paper sx={{ borderRadius: 2, overflow: 'hidden', minWidth: isSmall ? 860 : 'auto' }}>
            <DataGrid
              rows={(items || []).map((c, idx) => ({
                ...c,
                _rowKey: String(c.CommentId ?? c.commentId ?? c.Id ?? idx)
              }))}
              getRowId={(r) => r._rowKey}
              columns={[
                {
                  field: 'combo',
                  headerName: 'COMBO',
                  flex: 1.25,
                  sortable: false,
                  renderCell: ({ row }) => (
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>
                        {row.Comboname || row.comboname || 'N/A'}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.35, color: '#94a3b8' }}>
                        Combo ID: #{row.Productcomboid || row.productcomboid} • Request ID: #{row.CommentId || row.commentId || row.Id}
                      </Typography>
                    </Box>
                  )
                },
                {
                  field: 'request',
                  headerName: 'REQUEST',
                  flex: 1.55,
                  sortable: false,
                  renderCell: ({ row }) => (
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="body2" sx={{ color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.25 }}>
                        {String(row.Comments || row.comments || '').replace('[EDIT REQUEST]', '').trim() || '—'}
                      </Typography>
                      {(row.Checked_Date || row.checked_Date || row.checked_date) && (
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.75, color: '#94a3b8' }}>
                          {row.Checked_Date || row.checked_Date || row.checked_date}
                        </Typography>
                      )}
                    </Box>
                  )
                },
                {
                  field: 'submittedBy',
                  headerName: 'SUBMITTED BY',
                  flex: 0.7,
                  sortable: false,
                  renderCell: ({ row }) => (
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>
                        {row.Username || row.username || '—'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8', wordBreak: 'break-all' }}>
                        {row.Userid || row.userid || ''}
                      </Typography>
                    </Box>
                  )
                },
                {
                  field: 'actions',
                  headerName: 'ACTIONS',
                  flex: 0.55,
                  sortable: false,
                  filterable: false,
                  align: 'center',
                  headerAlign: 'center',
                  renderCell: ({ row }) => (
                    <Stack direction="row" spacing={1} justifyContent="center" sx={{ width: '100%' }}>
                      <Tooltip title="Approve">
                        <IconButton
                          onClick={() => openModal(row, '1')}
                          size="small"
                          sx={{
                            bgcolor: '#ecfdf5',
                            border: '1px solid #bbf7d0',
                            '&:hover': { bgcolor: '#dcfce7' }
                          }}
                        >
                          <CheckCircleIcon fontSize="small" sx={{ color: '#16a34a' }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reject">
                        <IconButton
                          onClick={() => openModal(row, '2')}
                          size="small"
                          sx={{
                            bgcolor: '#fef2f2',
                            border: '1px solid #fecaca',
                            '&:hover': { bgcolor: '#fee2e2' }
                          }}
                        >
                          <CancelIcon fontSize="small" sx={{ color: '#ef4444' }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  )
                }
              ]}
              rowCount={totalCount}
              loading={loading}
              columnHeaderHeight={48}
              pagination
              paginationMode="server"
              pageSizeOptions={[10, 25, 50]}
              paginationModel={{ page: Math.max(0, currentPage - 1), pageSize: itemsPerPage }}
              onPaginationModelChange={(m) => {
                setCurrentPage(Number(m.page) + 1);
              }}
              disableRowSelectionOnClick
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  bgcolor: '#334155',
                  color: 'white',
                  borderBottom: '1px solid #1f2937'
                },
                '& .MuiDataGrid-columnHeader': { bgcolor: '#334155' },
                '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 900, color: 'white' },
                '& .MuiDataGrid-iconButtonContainer, & .MuiDataGrid-menuIcon': { color: 'white' },
                '& .MuiDataGrid-cell': { py: isSmall ? 0.8 : 1.2 },
                '& .MuiDataGrid-row:hover': { bgcolor: '#f8fafc' }
              }}
              rowHeight={isSmall ? 60 : 72}
              autoHeight
            />
          </Paper>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            Page {currentPage} of {totalPages}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} sx={{ textTransform: 'none' }}>
              Prev
            </Button>
            <Button variant="outlined" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} sx={{ textTransform: 'none' }}>
              Next
            </Button>
          </Stack>
        </Box>

        <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 800 }}>{modalData.status === '1' ? 'Approve Edit Request' : 'Reject Edit Request'}</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              multiline
              minRows={4}
              label="Comments"
              placeholder="Enter your remarks (optional)"
              value={modalData.comments}
              onChange={(e) => setModalData((prev) => ({ ...prev, comments: e.target.value }))}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setShowModal(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
            <Button
              onClick={submitDecision}
              variant="contained"
              disabled={loading}
              sx={{
                textTransform: 'none',
                fontWeight: 800,
                bgcolor: modalData.status === '1' ? '#16a34a' : '#ef4444',
                '&:hover': { bgcolor: modalData.status === '1' ? '#15803d' : '#dc2626' }
              }}
            >
              Submit
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
};

export default ComboEditRequestSection;

