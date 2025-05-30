import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate,
  useNavigate,
  NavLink
} from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  CssBaseline,
  ThemeProvider,
  createTheme,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  Grid,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Badge,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  useMediaQuery
} from '@mui/material';
import {
  People as PeopleIcon,
  MedicalServices as MedicalServicesIcon,
  Inventory as InventoryIcon,
  ExitToApp as ExitToAppIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Lock as LockIcon,
  Dashboard as DashboardIcon,
  Assignment as RecordsIcon,
  Notifications as NotificationsIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material';

// API Endpoints
const API_AUTH_BASE_URL = 'http://localhost:8000/api/auth/'; 
const API_PATIENTS_BASE_URL = 'http://localhost:8002/api/patients/'; 
const API_STAFF_BASE_URL = 'http://localhost:8003/api/staff/'; 
const API_INVENTORY_BASE_URL = 'http://localhost:8001/api/inventory/'; 
const API_VISITS_BASE_URL = 'http://localhost:8004/api/visit/'; 

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(30, 30, 30, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(30, 30, 30, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(30, 30, 30, 0.7)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
  },
});

const apiClient = axios.create();

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const AuthContext = React.createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        try {
          const response = await apiClient.get(`${API_AUTH_BASE_URL}user/`); 
          setUser(response.data);
        } catch (error) {
          console.error("Token verification failed", error);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    verifyToken();
  }, []);

  const login = async (credentials) => {
    try {
      const payload = {
        username: credentials.email, 
        password: credentials.password,
      };
      const response = await axios.post(`${API_AUTH_BASE_URL}login/`, payload);
      localStorage.setItem('token', response.data.token);
      setToken(response.data.token);
      setUser(response.data.user);
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.non_field_errors?.[0] || 
                           error.response?.data?.detail || 
                           error.response?.data?.message || 
                           'Login failed';
      return { success: false, message: errorMessage };
    }
  };

  const register = async (userData) => {
    try {
      const payload = {
        username: userData.email,
        email: userData.email,
        password: userData.password,
        first_name: userData.name,
      };
      const response = await axios.post(`${API_AUTH_BASE_URL}register/`, payload);
      return { success: true, data: response.data };
    } catch (error) {
      let errorMessage = 'Registration failed';
      if (error.response?.data) {
        const errors = error.response.data;
        const fieldErrors = Object.keys(errors)
          .map(key => `${key}: ${errors[key].join ? errors[key].join(', ') : errors[key]}`)
          .join('; ');
        if (fieldErrors) errorMessage = fieldErrors;
        else if (errors.detail) errorMessage = errors.detail;
      }
      return { success: false, message: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    setUser,
    token,
    setToken,
    login,
    register,
    logout,
    loadingAuth: loading,
  };

  if (loading) return <Typography>Loading...</Typography>; 

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = () => {
  return React.useContext(AuthContext);
};

const ProtectedRoute = ({ children }) => {
  const { token, loadingAuth } = useAuth(); 
  if (loadingAuth) return <Typography>Checking authentication...</Typography>; 
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(credentials);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #121212 0%, #1e1e1e 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 2,
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 450, p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Avatar sx={{ bgcolor: 'secondary.main', width: 60, height: 60 }}>
              <LockIcon fontSize="large" />
            </Avatar>
          </Box>
          <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 600 }}>
            Hospital System
          </Typography>
          <Typography variant="body1" align="center" color="textSecondary" gutterBottom>
            Sign in to access the dashboard
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <TextField
              label="Email"
              variant="outlined"
              fullWidth
              margin="normal"
              value={credentials.email}
              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              label="Password"
              type="password"
              variant="outlined"
              fullWidth
              margin="normal"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              required
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              sx={{ mb: 2, py: 1.5 }}
            >
              Sign In
            </Button>
            <Button
              fullWidth
              color="secondary"
              onClick={() => navigate('/register')}
              sx={{ py: 1 }}
            >
              Don't have an account? Register
            </Button>
          </form>
        </Card>
      </Box>
    </ThemeProvider>
  );
};

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await register(userData);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } else {
      setError(result.message);
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #121212 0%, #1e1e1e 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 2,
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 500, p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Avatar sx={{ bgcolor: 'secondary.main', width: 60, height: 60 }}>
              <PersonIcon fontSize="large" />
            </Avatar>
          </Box>
          <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 600 }}>
            Create Account
          </Typography>
          <Typography variant="body1" align="center" color="textSecondary" gutterBottom>
            Join our hospital management system
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Registration successful! Redirecting to login...
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <TextField
              label="Full Name"
              variant="outlined"
              fullWidth
              margin="normal"
              value={userData.name}
              onChange={(e) => setUserData({ ...userData, name: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              label="Email"
              type="email"
              variant="outlined"
              fullWidth
              margin="normal"
              value={userData.email}
              onChange={(e) => setUserData({ ...userData, email: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              label="Password"
              type="password"
              variant="outlined"
              fullWidth
              margin="normal"
              value={userData.password}
              onChange={(e) => setUserData({ ...userData, password: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth margin="normal" sx={{ mb: 3 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={userData.role}
                label="Role"
                onChange={(e) => setUserData({ ...userData, role: e.target.value })}
                required
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="doctor">Doctor</MenuItem>
                <MenuItem value="nurse">Nurse</MenuItem>
                <MenuItem value="staff">Staff</MenuItem>
              </Select>
            </FormControl>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              sx={{ mb: 2, py: 1.5 }}
            >
              Register
            </Button>
            <Button
              fullWidth
              color="secondary"
              onClick={() => navigate('/login')}
              sx={{ py: 1 }}
            >
              Already have an account? Login
            </Button>
          </form>
        </Card>
      </Box>
    </ThemeProvider>
  );
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width:900px)');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Patients', icon: <PeopleIcon />, path: '/patients' },
    { text: 'Staff', icon: <PeopleIcon />, path: '/staff' },
    { text: 'Inventory', icon: <InventoryIcon />, path: '/inventory' },
    { text: 'Records', icon: <RecordsIcon />, path: '/records' },
  ];

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <>
      <AppBar position="sticky" elevation={0}>
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={toggleMobileMenu}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
            <MedicalServicesIcon sx={{ mr: 1 }} />
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
              MedCare
            </Typography>
          </Box>
          
          {!isMobile && (
            <Box sx={{ display: 'flex', flexGrow: 1 }}>
              {navItems.map((item) => (
                <Button
                  key={item.text}
                  color="inherit"
                  startIcon={item.icon}
                  component={NavLink}
                  to={item.path}
                  sx={{
                    mx: 1,
                    '&.active': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  {item.text}
                </Button>
              ))}
            </Box>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton color="inherit" sx={{ mr: 1 }}>
              <Badge badgeContent={4} color="secondary">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <Chip
              avatar={<Avatar>{user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}</Avatar>}
              label={user?.first_name || user?.username || 'User'}
              variant="outlined"
              color="primary"
              sx={{ mr: 2 }}
            />
            <Button 
              color="inherit" 
              onClick={logout} 
              startIcon={<ExitToAppIcon />}
              sx={{ ml: 1 }}
            >
              {!isMobile && 'Logout'}
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Mobile Menu */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={toggleMobileMenu}
        sx={{
          '& .MuiDrawer-paper': {
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(30, 30, 30, 0.9)',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }}
      >
        <Box sx={{ width: 250 }}>
          <Toolbar>
            <IconButton onClick={toggleMobileMenu}>
              <ChevronLeftIcon />
            </IconButton>
          </Toolbar>
          <Divider />
          <List>
            {navItems.map((item) => (
              <ListItem 
                button 
                key={item.text}
                component={NavLink}
                to={item.path}
                onClick={toggleMobileMenu}
                sx={{
                  '&.active': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'inherit' }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
};

const DashboardLayout = ({ children }) => {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
        }}
      >
        <Navbar />
        <Container maxWidth="xl" sx={{ py: 3 }}>
          {children}
        </Container>
      </Box>
    </ThemeProvider>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState({
    patients: 0,
    staff: 0,
    inventory: 0,
    records: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [patientsRes, staffRes, inventoryRes, recordsRes] = await Promise.all([
          apiClient.get(API_PATIENTS_BASE_URL + 'count/'),
          apiClient.get(API_STAFF_BASE_URL + 'count/'),
          apiClient.get(API_INVENTORY_BASE_URL + 'count/'), 
          apiClient.get(API_VISITS_BASE_URL + 'count/')     
        ]);
        
        setStats({
          patients: patientsRes.data.count,
          staff: staffRes.data.count,
          inventory: inventoryRes.data.count,
          records: recordsRes.data.count
        });
      } catch (error) {
        console.error('Error fetching stats:', error.response?.data || error.message);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { 
      title: 'Patients', 
      value: stats.patients, 
      icon: <PeopleIcon fontSize="large" />,
      color: 'primary'
    },
    { 
      title: 'Staff Members', 
      value: stats.staff, 
      icon: <PeopleIcon fontSize="large" />,
      color: 'secondary'
    },
    { 
      title: 'Inventory Items', 
      value: stats.inventory, 
      icon: <InventoryIcon fontSize="large" />,
      color: 'info'
    },
    { 
      title: 'Medical Records', 
      value: stats.records, 
      icon: <RecordsIcon fontSize="large" />,
      color: 'success'
    }
  ];

  return (
    <>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 600 }}>
        Dashboard Overview
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Typography color="textSecondary" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="h3" component="div">
                      {card.value}
                    </Typography>
                  </div>
                  <Avatar sx={{ bgcolor: `${card.color}.main`, width: 56, height: 56 }}>
                    {card.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Recent Patients
              </Typography>
              <Typography color="textSecondary">
                Patient activity will appear here
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Upcoming Appointments
              </Typography>
              <Typography color="textSecondary">
                Appointments will appear here
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
};

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [filters, setFilters] = useState({
    gender: '',
    ageMin: '',
    ageMax: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [patients, searchTerm, filters]);

  const fetchPatients = async () => {
    try {
      const res = await apiClient.get(API_PATIENTS_BASE_URL);
      setPatients(res.data);
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Failed to fetch patients', 'error');
    }
  };

  const filterPatients = () => {
    let result = patients;
    
    if (searchTerm) {
      result = result.filter(patient => 
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filters.gender) {
      result = result.filter(patient => patient.gender === filters.gender);
    }
    
    if (filters.ageMin) {
      result = result.filter(patient => patient.age >= parseInt(filters.ageMin));
    }
    
    if (filters.ageMax) {
      result = result.filter(patient => patient.age <= parseInt(filters.ageMax));
    }
    
    setFilteredPatients(result);
  };

  const handleOpenDialog = (patient = null) => {
    setCurrentPatient(patient || {
      name: '',
      age: '',
      gender: '',
      email: '',
      phone: '',
      address: ''
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentPatient(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (currentPatient.id) {
        await apiClient.put(`${API_PATIENTS_BASE_URL}${currentPatient.id}/`, currentPatient);
        showSnackbar('Patient updated successfully');
      } else {
        await apiClient.post(API_PATIENTS_BASE_URL, currentPatient);
        showSnackbar('Patient added successfully');
      }
      fetchPatients();
      handleCloseDialog();
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Operation failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`${API_PATIENTS_BASE_URL}${id}/`);
      showSnackbar('Patient deleted successfully');
      fetchPatients();
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Delete failed', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Patients Management
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          New Patient
        </Button>
      </Box>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: showFilters ? 2 : 0 }}>
            <TextField
              placeholder="Search patients..."
              variant="outlined"
              size="small"
              fullWidth
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ mr: 2 }}
            />
            <Button
              startIcon={showFilters ? <ChevronRightIcon /> : <FilterIcon />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {showFilters ? 'Hide' : 'Filters'}
            </Button>
          </Box>
          
          {showFilters && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Gender</InputLabel>
                  <Select
                    value={filters.gender}
                    label="Gender"
                    onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Min Age"
                  type="number"
                  size="small"
                  fullWidth
                  value={filters.ageMin}
                  onChange={(e) => setFilters({ ...filters, ageMin: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Max Age"
                  type="number"
                  size="small"
                  fullWidth
                  value={filters.ageMax}
                  onChange={(e) => setFilters({ ...filters, ageMax: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  startIcon={<ClearIcon />}
                  onClick={() => setFilters({
                    gender: '',
                    ageMin: '',
                    ageMax: ''
                  })}
                >
                  Clear
                </Button>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Age</TableCell>
                <TableCell>Gender</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPatients.map((patient) => (
                <TableRow key={patient.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ width: 36, height: 36, mr: 2 }}>
                        {patient.name.charAt(0)}
                      </Avatar>
                      {patient.name}
                    </Box>
                  </TableCell>
                  <TableCell>{patient.age}</TableCell>
                  <TableCell>
                    <Chip 
                      label={patient.gender} 
                      size="small"
                      color={patient.gender === 'Male' ? 'primary' : patient.gender === 'Female' ? 'secondary' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      {patient.email && (
                        <Typography variant="body2" color="textSecondary">
                          {patient.email}
                        </Typography>
                      )}
                      {patient.phone && (
                        <Typography variant="body2">
                          {patient.phone}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton 
                      onClick={() => handleOpenDialog(patient)}
                      sx={{ color: 'primary.main' }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      onClick={() => handleDelete(patient.id)}
                      sx={{ color: 'error.main' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
      
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 600 }}>
          {currentPatient?.id ? 'Edit Patient' : 'Add New Patient'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Full Name"
              name="name"
              fullWidth
              margin="normal"
              value={currentPatient?.name || ''}
              onChange={handleInputChange}
              required
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Age"
                  name="age"
                  type="number"
                  fullWidth
                  margin="normal"
                  value={currentPatient?.age || ''}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Gender</InputLabel>
                  <Select
                    name="gender"
                    value={currentPatient?.gender || ''}
                    label="Gender"
                    onChange={handleInputChange}
                    required
                  >
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <TextField
              label="Email"
              name="email"
              type="email"
              fullWidth
              margin="normal"
              value={currentPatient?.email || ''}
              onChange={handleInputChange}
            />
            <TextField
              label="Phone"
              name="phone"
              fullWidth
              margin="normal"
              value={currentPatient?.phone || ''}
              onChange={handleInputChange}
            />
            <TextField
              label="Address"
              name="address"
              fullWidth
              margin="normal"
              multiline
              rows={2}
              value={currentPatient?.address || ''}
              onChange={handleInputChange}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            sx={{ minWidth: 100 }}
          >
            {currentPatient?.id ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

const Staff = () => {
  const [staff, setStaff] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentStaff, setCurrentStaff] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [filters, setFilters] = useState({
    role: '',
    department: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    filterStaff();
  }, [staff, searchTerm, filters]);

  const fetchStaff = async () => {
    try {
      const res = await apiClient.get(API_STAFF_BASE_URL);
      setStaff(res.data);
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Failed to fetch staff', 'error');
    }
  };

  const filterStaff = () => {
    let result = staff;
    
    if (searchTerm) {
      result = result.filter(staff => 
        staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filters.role) {
      result = result.filter(staff => staff.role === filters.role);
    }
    
    if (filters.department) {
      result = result.filter(staff => staff.department === filters.department);
    }
    
    setFilteredStaff(result);
  };

  const handleOpenDialog = (staff = null) => {
    setCurrentStaff(staff || {
      name: '',
      email: '',
      phone: '',
      role: 'nurse',
      department: '',
      hireDate: new Date().toISOString().split('T')[0]
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentStaff(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (currentStaff.id) {
        await apiClient.put(`${API_STAFF_BASE_URL}${currentStaff.id}/`, currentStaff);
        showSnackbar('Staff updated successfully');
      } else {
        await apiClient.post(API_STAFF_BASE_URL, currentStaff);
        showSnackbar('Staff added successfully');
      }
      fetchStaff();
      handleCloseDialog();
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Operation failed'),
        showSnackbar(error.response?.data?.detail || 'Operation failed', 'error');
      }
    };
  
    const handleDelete = async (id) => {
      try {
        await apiClient.delete(`${API_STAFF_BASE_URL}${id}/`);
        showSnackbar('Staff deleted successfully');
        fetchStaff();
      } catch (error) {
        showSnackbar(error.response?.data?.detail || 'Delete failed', 'error');
      }
    };
  
    const showSnackbar = (message, severity = 'success') => {
      setSnackbar({ open: true, message, severity });
    };
  
    const handleCloseSnackbar = () => {
      setSnackbar(prev => ({ ...prev, open: false }));
    };
  
    return (
      <>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Staff Management
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            New Staff
          </Button>
        </Box>
        
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: showFilters ? 2 : 0 }}>
              <TextField
                placeholder="Search staff..."
                variant="outlined"
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mr: 2 }}
              />
              <Button
                startIcon={showFilters ? <ChevronRightIcon /> : <FilterIcon />}
                onClick={() => setShowFilters(!showFilters)}
                sx={{ whiteSpace: 'nowrap' }}
              >
                {showFilters ? 'Hide' : 'Filters'}
              </Button>
            </Box>
            
            {showFilters && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Role</InputLabel>
                    <Select
                      value={filters.role}
                      label="Role"
                      onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                    >
                      <MenuItem value="">All Roles</MenuItem>
                      <MenuItem value="doctor">Doctor</MenuItem>
                      <MenuItem value="nurse">Nurse</MenuItem>
                      <MenuItem value="admin">Administrator</MenuItem>
                      <MenuItem value="staff">Support Staff</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Department</InputLabel>
                    <Select
                      value={filters.department}
                      label="Department"
                      onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                    >
                      <MenuItem value="">All Departments</MenuItem>
                      <MenuItem value="Cardiology">Cardiology</MenuItem>
                      <MenuItem value="Neurology">Neurology</MenuItem>
                      <MenuItem value="Pediatrics">Pediatrics</MenuItem>
                      <MenuItem value="Surgery">Surgery</MenuItem>
                      <MenuItem value="Emergency">Emergency</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Button 
                    variant="outlined" 
                    fullWidth 
                    startIcon={<ClearIcon />}
                    onClick={() => setFilters({
                      role: '',
                      department: ''
                    })}
                  >
                    Clear Filters
                  </Button>
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStaff.map((staff) => (
                  <TableRow key={staff.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ width: 36, height: 36, mr: 2 }}>
                          {staff.name.charAt(0)}
                        </Avatar>
                        {staff.name}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={staff.role} 
                        size="small"
                        color={
                          staff.role === 'doctor' ? 'primary' : 
                          staff.role === 'nurse' ? 'secondary' : 
                          'default'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={staff.department} 
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        {staff.email && (
                          <Typography variant="body2" color="textSecondary">
                            {staff.email}
                          </Typography>
                        )}
                        {staff.phone && (
                          <Typography variant="body2">
                            {staff.phone}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton 
                        onClick={() => handleOpenDialog(staff)}
                        sx={{ color: 'primary.main' }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleDelete(staff.id)}
                        sx={{ color: 'error.main' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
        
        <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
          <DialogTitle sx={{ fontWeight: 600 }}>
            {currentStaff?.id ? 'Edit Staff' : 'Add New Staff'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <TextField
                label="Full Name"
                name="name"
                fullWidth
                margin="normal"
                value={currentStaff?.name || ''}
                onChange={handleInputChange}
                required
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Role</InputLabel>
                    <Select
                      name="role"
                      value={currentStaff?.role || ''}
                      label="Role"
                      onChange={handleInputChange}
                      required
                    >
                      <MenuItem value="doctor">Doctor</MenuItem>
                      <MenuItem value="nurse">Nurse</MenuItem>
                      <MenuItem value="admin">Administrator</MenuItem>
                      <MenuItem value="staff">Support Staff</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Department</InputLabel>
                    <Select
                      name="department"
                      value={currentStaff?.department || ''}
                      label="Department"
                      onChange={handleInputChange}
                    >
                      <MenuItem value="">Select Department</MenuItem>
                      <MenuItem value="Cardiology">Cardiology</MenuItem>
                      <MenuItem value="Neurology">Neurology</MenuItem>
                      <MenuItem value="Pediatrics">Pediatrics</MenuItem>
                      <MenuItem value="Surgery">Surgery</MenuItem>
                      <MenuItem value="Emergency">Emergency</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <TextField
                label="Email"
                name="email"
                type="email"
                fullWidth
                margin="normal"
                value={currentStaff?.email || ''}
                onChange={handleInputChange}
                required
              />
              <TextField
                label="Phone"
                name="phone"
                fullWidth
                margin="normal"
                value={currentStaff?.phone || ''}
                onChange={handleInputChange}
              />
              <TextField
                label="Hire Date"
                name="hireDate"
                type="date"
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
                value={currentStaff?.hireDate || ''}
                onChange={handleInputChange}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained" 
              color="primary"
              sx={{ minWidth: 100 }}
            >
              {currentStaff?.id ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>
        
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </>
    );
  };
  
  const Inventory = () => {
    const [inventory, setInventory] = useState([]);
    const [filteredInventory, setFilteredInventory] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [filters, setFilters] = useState({
      category: '',
      minStock: '',
      maxStock: ''
    });
    const [showFilters, setShowFilters] = useState(false);
  
    useEffect(() => {
      fetchInventory();
    }, []);
  
    useEffect(() => {
      filterInventory();
    }, [inventory, searchTerm, filters]);
  
    const fetchInventory = async () => {
      try {
        const res = await apiClient.get(API_INVENTORY_BASE_URL);
        setInventory(res.data);
      } catch (error) {
        showSnackbar(error.response?.data?.detail || 'Failed to fetch inventory', 'error');
      }
    };
  
    const filterInventory = () => {
      let result = inventory;
      
      if (searchTerm) {
        result = result.filter(item => 
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      if (filters.category) {
        result = result.filter(item => item.category === filters.category);
      }
      
      if (filters.minStock) {
        result = result.filter(item => item.quantity >= parseInt(filters.minStock));
      }
      
      if (filters.maxStock) {
        result = result.filter(item => item.quantity <= parseInt(filters.maxStock));
      }
      
      setFilteredInventory(result);
    };
  
    const handleOpenDialog = (item = null) => {
      setCurrentItem(item || {
        name: '',
        description: '',
        category: 'medication',
        quantity: 0,
        unit: '',
        expiryDate: ''
      });
      setOpenDialog(true);
    };
  
    const handleCloseDialog = () => {
      setOpenDialog(false);
    };
  
    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setCurrentItem(prev => ({ ...prev, [name]: value }));
    };
  
    const handleSubmit = async () => {
      try {
        if (currentItem.id) {
          await apiClient.put(`${API_INVENTORY_BASE_URL}${currentItem.id}/`, currentItem);
          showSnackbar('Item updated successfully');
        } else {
          await apiClient.post(API_INVENTORY_BASE_URL, currentItem);
          showSnackbar('Item added successfully');
        }
        fetchInventory();
        handleCloseDialog();
      } catch (error) {
        showSnackbar(error.response?.data?.detail || 'Operation failed', 'error');
      }
    };
  
    const handleDelete = async (id) => {
      try {
        await apiClient.delete(`${API_INVENTORY_BASE_URL}${id}/`);
        showSnackbar('Item deleted successfully');
        fetchInventory();
      } catch (error) {
        showSnackbar(error.response?.data?.detail || 'Delete failed', 'error');
      }
    };
  
    const showSnackbar = (message, severity = 'success') => {
      setSnackbar({ open: true, message, severity });
    };
  
    const handleCloseSnackbar = () => {
      setSnackbar(prev => ({ ...prev, open: false }));
    };
  
    return (
      <>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Inventory Management
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            New Item
          </Button>
        </Box>
        
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: showFilters ? 2 : 0 }}>
              <TextField
                placeholder="Search inventory..."
                variant="outlined"
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mr: 2 }}
              />
              <Button
                startIcon={showFilters ? <ChevronRightIcon /> : <FilterIcon />}
                onClick={() => setShowFilters(!showFilters)}
                sx={{ whiteSpace: 'nowrap' }}
              >
                {showFilters ? 'Hide' : 'Filters'}
              </Button>
            </Box>
            
            {showFilters && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={filters.category}
                      label="Category"
                      onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    >
                      <MenuItem value="">All Categories</MenuItem>
                      <MenuItem value="medication">Medication</MenuItem>
                      <MenuItem value="equipment">Equipment</MenuItem>
                      <MenuItem value="supply">Supply</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Min Stock"
                    type="number"
                    size="small"
                    fullWidth
                    value={filters.minStock}
                    onChange={(e) => setFilters({ ...filters, minStock: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Max Stock"
                    type="number"
                    size="small"
                    fullWidth
                    value={filters.maxStock}
                    onChange={(e) => setFilters({ ...filters, maxStock: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button 
                    variant="outlined" 
                    fullWidth 
                    startIcon={<ClearIcon />}
                    onClick={() => setFilters({
                      category: '',
                      minStock: '',
                      maxStock: ''
                    })}
                  >
                    Clear
                  </Button>
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Expiry Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInventory.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 500 }}>{item.name}</Typography>
                      {item.description && (
                        <Typography variant="body2" color="textSecondary">
                          {item.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={item.category} 
                        size="small"
                        color={
                          item.category === 'medication' ? 'primary' : 
                          item.category === 'equipment' ? 'secondary' : 
                          'default'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography sx={{ mr: 1 }}>
                          {item.quantity}
                        </Typography>
                        {item.unit && (
                          <Typography variant="body2" color="textSecondary">
                            {item.unit}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {item.expiryDate ? (
                        new Date(item.expiryDate).toLocaleDateString()
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          N/A
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton 
                        onClick={() => handleOpenDialog(item)}
                        sx={{ color: 'primary.main' }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleDelete(item.id)}
                        sx={{ color: 'error.main' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
        
        <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
          <DialogTitle sx={{ fontWeight: 600 }}>
            {currentItem?.id ? 'Edit Item' : 'Add New Item'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <TextField
                label="Item Name"
                name="name"
                fullWidth
                margin="normal"
                value={currentItem?.name || ''}
                onChange={handleInputChange}
                required
              />
              <TextField
                label="Description"
                name="description"
                fullWidth
                margin="normal"
                multiline
                rows={2}
                value={currentItem?.description || ''}
                onChange={handleInputChange}
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Category</InputLabel>
                    <Select
                      name="category"
                      value={currentItem?.category || ''}
                      label="Category"
                      onChange={handleInputChange}
                      required
                    >
                      <MenuItem value="medication">Medication</MenuItem>
                      <MenuItem value="equipment">Equipment</MenuItem>
                      <MenuItem value="supply">Supply</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Unit"
                    name="unit"
                    fullWidth
                    margin="normal"
                    value={currentItem?.unit || ''}
                    onChange={handleInputChange}
                  />
                </Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Quantity"
                    name="quantity"
                    type="number"
                    fullWidth
                    margin="normal"
                    value={currentItem?.quantity || ''}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Expiry Date"
                    name="expiryDate"
                    type="date"
                    fullWidth
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                    value={currentItem?.expiryDate || ''}
                    onChange={handleInputChange}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained" 
              color="primary"
              sx={{ minWidth: 100 }}
            >
              {currentItem?.id ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>
        
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </>
    );
  };
  
  const Records = () => {
    const [records, setRecords] = useState([]);
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [currentRecord, setCurrentRecord] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [filters, setFilters] = useState({
      patient: '',
      doctor: '',
      dateFrom: '',
      dateTo: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
  
    useEffect(() => {
      fetchRecords();
      fetchPatients();
      fetchDoctors();
    }, []);
  
    useEffect(() => {
      filterRecords();
    }, [records, searchTerm, filters]);
  
    const fetchRecords = async () => {
      try {
        const res = await apiClient.get(API_VISITS_BASE_URL);
        setRecords(res.data);
      } catch (error) {
        showSnackbar(error.response?.data?.detail || 'Failed to fetch records', 'error');
      }
    };
  
    const fetchPatients = async () => {
      try {
        const res = await apiClient.get(API_PATIENTS_BASE_URL);
        setPatients(res.data);
      } catch (error) {
        console.error('Failed to fetch patients:', error);
      }
    };
  
    const fetchDoctors = async () => {
      try {
        const res = await apiClient.get(API_STAFF_BASE_URL + '?role=doctor');
        setDoctors(res.data);
      } catch (error) {
        console.error('Failed to fetch doctors:', error);
      }
    };
  
    const filterRecords = () => {
      let result = records;
      
      if (searchTerm) {
        result = result.filter(record => 
          record.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      if (filters.patient) {
        result = result.filter(record => record.patient == filters.patient);
      }
      
      if (filters.doctor) {
        result = result.filter(record => record.doctor == filters.doctor);
      }
      
      if (filters.dateFrom) {
        result = result.filter(record => new Date(record.visit_date) >= new Date(filters.dateFrom));
      }
      
      if (filters.dateTo) {
        result = result.filter(record => new Date(record.visit_date) <= new Date(filters.dateTo));
      }
      
      setFilteredRecords(result);
    };
  
    const handleOpenDialog = (record = null) => {
      setCurrentRecord(record || {
        patient: '',
        doctor: '',
        visit_date: new Date().toISOString().split('T')[0],
        diagnosis: '',
        treatment: '',
        notes: ''
      });
      setOpenDialog(true);
    };
  
    const handleCloseDialog = () => {
      setOpenDialog(false);
    };
  
    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setCurrentRecord(prev => ({ ...prev, [name]: value }));
    };
  
    const handleSubmit = async () => {
      try {
        if (currentRecord.id) {
          await apiClient.put(`${API_VISITS_BASE_URL}${currentRecord.id}/`, currentRecord);
          showSnackbar('Record updated successfully');
        } else {
          await apiClient.post(API_VISITS_BASE_URL, currentRecord);
          showSnackbar('Record added successfully');
        }
        fetchRecords();
        handleCloseDialog();
      } catch (error) {
        showSnackbar(error.response?.data?.detail || 'Operation failed', 'error');
      }
    };
  
    const handleDelete = async (id) => {
      try {
        await apiClient.delete(`${API_VISITS_BASE_URL}${id}/`);
        showSnackbar('Record deleted successfully');
        fetchRecords();
      } catch (error) {
        showSnackbar(error.response?.data?.detail || 'Delete failed', 'error');
      }
    };
  
    const showSnackbar = (message, severity = 'success') => {
      setSnackbar({ open: true, message, severity });
    };
  
    const handleCloseSnackbar = () => {
      setSnackbar(prev => ({ ...prev, open: false }));
    };
  
    return (
      <>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Medical Records
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            New Record
          </Button>
        </Box>
        
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: showFilters ? 2 : 0 }}>
              <TextField
                placeholder="Search records..."
                variant="outlined"
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mr: 2 }}
              />
              <Button
                startIcon={showFilters ? <ChevronRightIcon /> : <FilterIcon />}
                onClick={() => setShowFilters(!showFilters)}
                sx={{ whiteSpace: 'nowrap' }}
              >
                {showFilters ? 'Hide' : 'Filters'}
              </Button>
            </Box>
            
            {showFilters && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Patient</InputLabel>
                    <Select
                      value={filters.patient}
                      label="Patient"
                      onChange={(e) => setFilters({ ...filters, patient: e.target.value })}
                    >
                      <MenuItem value="">All Patients</MenuItem>
                      {patients.map(patient => (
                        <MenuItem key={patient.id} value={patient.id}>
                          {patient.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Doctor</InputLabel>
                    <Select
                      value={filters.doctor}
                      label="Doctor"
                      onChange={(e) => setFilters({ ...filters, doctor: e.target.value })}
                    >
                      <MenuItem value="">All Doctors</MenuItem>
                      {doctors.map(doctor => (
                        <MenuItem key={doctor.id} value={doctor.id}>
                          {doctor.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="From Date"
                    type="date"
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="To Date"
                    type="date"
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button 
                    variant="outlined" 
                    fullWidth 
                    startIcon={<ClearIcon />}
                    onClick={() => setFilters({
                      patient: '',
                      doctor: '',
                      dateFrom: '',
                      dateTo: ''
                    })}
                  >
                    Clear Filters
                  </Button>
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Patient</TableCell>
                  <TableCell>Doctor</TableCell>
                  <TableCell>Visit Date</TableCell>
                  <TableCell>Diagnosis</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 500 }}>
                        {record.patient_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography>
                        {record.doctor_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(record.visit_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {record.diagnosis}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton 
                        onClick={() => handleOpenDialog(record)}
                        sx={{ color: 'primary.main' }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleDelete(record.id)}
                        sx={{ color: 'error.main' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
        
        <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="md">
          <DialogTitle sx={{ fontWeight: 600 }}>
            {currentRecord?.id ? 'Edit Medical Record' : 'Add New Medical Record'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Patient</InputLabel>
                    <Select
                      name="patient"
                      value={currentRecord?.patient || ''}
                      label="Patient"
                      onChange={handleInputChange}
                      required
                    >
                      {patients.map(patient => (
                        <MenuItem key={patient.id} value={patient.id}>
                          {patient.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Doctor</InputLabel>
                    <Select
                      name="doctor"
                      value={currentRecord?.doctor || ''}
                      label="Doctor"
                      onChange={handleInputChange}
                      required
                    >
                      {doctors.map(doctor => (
                        <MenuItem key={doctor.id} value={doctor.id}>
                          {doctor.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <TextField
                label="Visit Date"
                name="visit_date"
                type="date"
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
                value={currentRecord?.visit_date || ''}
                onChange={handleInputChange}
                required
              />
              <TextField
                label="Diagnosis"
                name="diagnosis"
                fullWidth
                margin="normal"
                value={currentRecord?.diagnosis || ''}
                onChange={handleInputChange}
                required
              />
              <TextField
                label="Treatment"
                name="treatment"
                fullWidth
                margin="normal"
                multiline
                rows={3}
                value={currentRecord?.treatment || ''}
                onChange={handleInputChange}
              />
              <TextField
                label="Notes"
                name="notes"
                fullWidth
                margin="normal"
                multiline
                rows={3}
                value={currentRecord?.notes || ''}
                onChange={handleInputChange}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained" 
              color="primary"
              sx={{ minWidth: 100 }}
            >
              {currentRecord?.id ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>
        
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </>
    );
  };
  
  const App = () => {
    return (
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Dashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/patients" 
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Patients />
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/staff" 
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Staff />
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/inventory" 
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Inventory />
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/records" 
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Records />
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
    );
  };
  
  export default App;