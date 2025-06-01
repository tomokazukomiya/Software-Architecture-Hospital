import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate,
  NavLink, 
  useNavigate,
  useLocation
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
  Badge,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  useMediaQuery,
  Drawer,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox
} from '@mui/material';
import {
  People as PeopleIcon,  
  Inventory as InventoryIcon,
  ExitToApp as ExitToAppIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
  Dashboard as DashboardIcon,
  Assignment as RecordsIcon,
  Notifications as NotificationsIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Clear as ClearIcon, 
  Hotel as BedIcon,
  Healing as HealingIcon,
  MonitorHeart as MonitorHeartIcon,
  Medication as MedicationIcon,
  Biotech as BiotechIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import FilterListIcon from '@mui/icons-material/FilterList'; // Explicit import
import PersonIcon from '@mui/icons-material/Person'; // Explicit import
import IconButton from '@mui/material/IconButton'; // Explicit import

const API_AUTH_BASE_URL = 'http://localhost:8000/api/auth/';
const API_PATIENTS_BASE_URL = 'http://localhost:8002/api/patients/';
const API_STAFF_BASE_URL = 'http://localhost:8003/api/staff/';
const API_INVENTORY_BASE_URL = 'http://localhost:8001/api/inventory/inventoryitems/';
const API_VISITS_BASE_URL = 'http://localhost:8004/api/visit/emergency-visits/';
const API_BEDS_BASE_URL = 'http://localhost:8004/api/visit/beds/';
const API_ADMISSIONS_BASE_URL = 'http://localhost:8004/api/visit/admissions/';
const API_VITALS_BASE_URL = 'http://localhost:8004/api/visit/vital-signs/';
const API_TREATMENTS_BASE_URL = 'http://localhost:8004/api/visit/treatments/';
const API_DIAGNOSES_BASE_URL = 'http://localhost:8004/api/visit/diagnoses/';
const API_PRESCRIPTIONS_BASE_URL = 'http://localhost:8004/api/visit/prescriptions/';

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
  const isMobile = useMediaQuery('(max-width:900px)');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Patients', icon: <PeopleIcon />, path: '/patients' },
    { text: 'Staff', icon: <PeopleIcon />, path: '/staff' },
    { text: 'Inventory', icon: <InventoryIcon />, path: '/inventory' },
    { text: 'Records', icon: <RecordsIcon />, path: '/records' },
    { text: 'Beds', icon: <BedIcon />, path: '/beds' },
    { text: 'Diagnoses', icon: <BiotechIcon />, path: '/diagnoses' },
    { text: 'Treatments', icon: <HealingIcon />, path: '/treatments' },
    { text: 'Vitals', icon: <MonitorHeartIcon />, path: '/vitalsigns' },
    { text: 'Prescriptions', icon: <MedicationIcon />, path: '/prescriptions' },
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

          {!isMobile ? (
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
          ) : (
            <Box sx={{ flexGrow: 1 }} /> 
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
            <Chip
              avatar={<Avatar>{user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}</Avatar>}
              label={user?.first_name || user?.username || 'User'}
              variant="outlined"
              color="primary"
              sx={{ mr: isMobile ? 1 : 2 }}
            />
            <IconButton
              color="inherit"
              onClick={logout}
              title="Logout"
              sx={{ ml: isMobile ? 0 : 1 }}
            >
              <ExitToAppIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

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
  const location = useLocation();
  const [stats, setStats] = useState({
    patients: 0,
    staff: 0,
    inventory: 0,
    records: 0
  });
  const [recentPatients, setRecentPatients] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [patientsRes, staffRes, inventoryRes] = await Promise.all([
          apiClient.get(API_PATIENTS_BASE_URL + 'count/'),
          apiClient.get(API_STAFF_BASE_URL + 'count/'),
          apiClient.get(API_INVENTORY_BASE_URL + 'count/')
        ]);
        const visitsStatsRes = await apiClient.get(API_VISITS_BASE_URL + 'stats/');
        setStats({
          patients: patientsRes.data.count,
          staff: staffRes.data.count,
          inventory: inventoryRes.data.count,
          records: visitsStatsRes.data.total
        });

        const allPatientsData = await apiClient.get(API_PATIENTS_BASE_URL);
        const sortedPatients = [...allPatientsData.data]
          .sort((a, b) => parseInt(b.id) - parseInt(a.id))
          .slice(0, 5);
        setRecentPatients(sortedPatients);

      } catch (error) {
        console.error('Error fetching dashboard data:', error.response?.data || error.message);
      }
    };

    fetchStats();
  }, [location.pathname]);

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
    },
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
        <Grid item xs={12} md={12} >
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Recent Patients
              </Typography>
              {recentPatients.length > 0 ? (
                <List dense>
                  {recentPatients.map(patient => (
                    <ListItem key={patient.id} divider sx={{py: 1.5}}>
                      <ListItemIcon>
                        <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.light' }}>
                          {patient.first_name?.charAt(0)}{patient.last_name?.charAt(0)}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={`${patient.first_name} ${patient.last_name}`}
                        secondary={`DOB: ${new Date(patient.date_of_birth).toLocaleDateString()}`}
                      />
                      <Chip label={patient.gender} size="small" />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="textSecondary" sx={{ mt: 2, textAlign: 'center' }}>No recent patient activity.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
};

const calculateAgeUtil = (dateString) => {
  if (!dateString) return null;
  const birthDate = new Date(dateString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
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

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []); // No direct dependencies for setSnackbar setter

  const fetchPatients = useCallback(async () => {
    try {
      const res = await apiClient.get(API_PATIENTS_BASE_URL);
      setPatients(res.data);
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Failed to fetch patients', 'error');
    }
  }, [showSnackbar]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const calculateAge = useCallback(calculateAgeUtil, []);

  const filterPatients = useCallback(() => {
    let result = patients;

    if (searchTerm) {
      result = result.filter(patient =>
        ((patient.first_name || '') + ' ' + (patient.last_name || '')).toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.gender) {
      result = result.filter(patient => patient.gender === filters.gender);
    }

    if (filters.ageMin) {
      result = result.filter(patient => {
        if (!patient.date_of_birth) return false;
        const age = calculateAge(patient.date_of_birth);
        return age >= parseInt(filters.ageMin);
      });
    }
    if (filters.ageMax) {
      result = result.filter(patient => {
        if (!patient.date_of_birth) return false;
        const age = calculateAge(patient.date_of_birth);
        return age <= parseInt(filters.ageMax);
      });
    }

    setFilteredPatients(result);
  }, [patients, searchTerm, filters, calculateAge]);

  useEffect(() => {
    filterPatients();
  }, [filterPatients]);

  const handleOpenDialog = (patient = null) => {
    setCurrentPatient(patient || {
      first_name: '',
      last_name: '',
      date_of_birth: '',
      gender: '',
      email: '',
      phone_number: '',
      address: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      blood_type: '',
      allergies: '',
      pre_existing_conditions: '',
      insurance_info: ''
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
      const payload = {
        ...currentPatient,
      };
      if (currentPatient.id) {
        await apiClient.put(`${API_PATIENTS_BASE_URL}${currentPatient.id}/`, payload);
        showSnackbar('Patient updated successfully');
      } else {
        await apiClient.post(API_PATIENTS_BASE_URL, payload);
        showSnackbar('Patient added successfully');
      }
      fetchPatients();
      handleCloseDialog();
    } catch (error) {
      let errorMsg = 'Operation failed';
      if (error.response?.data) {
        const errors = error.response.data;
        errorMsg = Object.entries(errors)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('; ');
      }
      showSnackbar(errorMsg, 'error');
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
              startIcon={showFilters ? <ChevronRightIcon /> : <FilterListIcon />}
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
                    <MenuItem value="">Tutti</MenuItem>
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
                <TableCell>Date of Birth</TableCell>
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
                        {patient.first_name?.charAt(0) || ''}
                      </Avatar>
                      {patient.first_name} {patient.last_name}
                    </Box>
                  </TableCell>
                  <TableCell>{new Date(patient.date_of_birth).toLocaleDateString()}</TableCell>
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
                      {patient.phone_number && (
                        <Typography variant="body2">
                          {patient.phone_number}
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
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="First Name"
                  name="first_name"
                  fullWidth
                  margin="normal"
                  value={currentPatient?.first_name || ''}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Last Name"
                  name="last_name"
                  fullWidth
                  margin="normal"
                  value={currentPatient?.last_name || ''}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Date of Birth"
                  name="date_of_birth"
                  type="date"
                  fullWidth
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                  value={currentPatient?.date_of_birth || ''}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Gender</InputLabel>
                  <Select
                    name="gender"
                    value={currentPatient?.gender || ''}
                    label="Gender"
                    onChange={handleInputChange}
                    required
                  >
                    <MenuItem value="M">Male</MenuItem>
                    <MenuItem value="F">Female</MenuItem>
                    <MenuItem value="O">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email"
                  name="email"
                  type="email"
                  fullWidth
                  margin="normal"
                  value={currentPatient?.email || ''}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone"
                  name="phone_number"
                  fullWidth
                  margin="normal"
                  value={currentPatient?.phone_number || ''}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Address"
                  name="address"
                  fullWidth
                  margin="normal"
                  multiline
                  rows={2}
                  value={currentPatient?.address || ''}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Emergency Contact</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Emergency Contact Name"
                  name="emergency_contact_name"
                  fullWidth
                  margin="normal"
                  value={currentPatient?.emergency_contact_name || ''}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Emergency Contact Phone"
                  name="emergency_contact_phone"
                  fullWidth
                  margin="normal"
                  value={currentPatient?.emergency_contact_phone || ''}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Medical Information (Optional)</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Blood Type"
                  name="blood_type"
                  fullWidth
                  margin="normal"
                  value={currentPatient?.blood_type || ''}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Allergies"
                  name="allergies"
                  fullWidth
                  margin="normal"
                  multiline
                  rows={2}
                  value={currentPatient?.allergies || ''}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Pre-existing Conditions"
                  name="pre_existing_conditions"
                  fullWidth
                  margin="normal"
                  multiline
                  rows={2}
                  value={currentPatient?.pre_existing_conditions || ''}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Insurance Info"
                  name="insurance_info"
                  fullWidth
                  margin="normal"
                  multiline
                  rows={2}
                  value={currentPatient?.insurance_info || ''}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>
          </Box>
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
        </DialogContent>
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

const getStaffRoleColor = (role) => {
  switch(role) {
    case 'TEC': return 'primary';
    case 'ADM': return 'secondary';
    case 'RES': return 'info';
    case 'INT': return 'warning';
    default: return 'default';
  }
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
  const [users, setUsers] = useState([]);

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const fetchStaff = useCallback(async () => {
    try {
      const res = await apiClient.get(API_STAFF_BASE_URL);
      setStaff(res.data);
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Failed to fetch staff', 'error');
    }
  }, [showSnackbar]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await apiClient.get(`${API_AUTH_BASE_URL}users/`);
      setUsers(res.data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  }, [showSnackbar]);



  const filterStaff = useCallback(() => {
    let result = staff;

    if (searchTerm) {
      result = result.filter(staff =>
        ((staff.user?.first_name || '') + ' ' + (staff.user?.last_name || '')).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (staff.user?.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (staff.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (staff.phone_number || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.role) {
      result = result.filter(staff => staff.role === filters.role);
    }

    if (filters.department) {
      result = result.filter(staff => staff.department === filters.department);
    }

    setFilteredStaff(result);
  }, [staff, searchTerm, filters]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  useEffect(() => {
    filterStaff();
  }, [filterStaff]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenDialog = (staffMember = null) => {
    if (staffMember) {
      setCurrentStaff(staffMember);
    } else {
      setCurrentStaff({
        user: '', 
        role: 'TEC', 
        department: '',
        license_number: '',
        specialization: '',
        hire_date: new Date().toISOString().split('T')[0],
        is_active: true,
        shift_schedule: ''
      });
    }
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
      let payload;
      if (currentStaff.id) {
        payload = { ...currentStaff };
        if (payload.user && typeof payload.user === 'object' && payload.user.id) {
          payload.user = payload.user.id;
        }
        delete payload.password;

        await apiClient.put(`${API_STAFF_BASE_URL}${currentStaff.id}/`, payload);
      } else {
        const userId = parseInt(currentStaff.user);
        if (isNaN(userId) || !userId) {
          showSnackbar('Please select a user.', 'error');
          return;
        }
        if (!currentStaff.role) {
          showSnackbar('Role is required.', 'error');
          return;
        }
        if (!currentStaff.department) {
          showSnackbar('Department is required.', 'error');
          return;
        }
        if (!currentStaff.hire_date) {
          showSnackbar('Hire date is required.', 'error');
          return;
        }

        payload = {
          user_id: userId, 
          role: currentStaff.role,
          department: currentStaff.department,
          license_number: currentStaff.license_number,
          specialization: currentStaff.specialization,
          hire_date: currentStaff.hire_date,
          is_active: currentStaff.is_active === undefined ? true : currentStaff.is_active,
          shift_schedule: currentStaff.shift_schedule,
        };
        await apiClient.post(API_STAFF_BASE_URL, payload);
        showSnackbar('Staff added successfully');
      }
      fetchStaff();
      handleCloseDialog();
    } catch (error) {
      const errorData = error.response?.data;
      let errorMsg = 'Operation failed';
      if (errorData && typeof errorData === 'object') {
        errorMsg = Object.entries(errorData)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('; ');
      } else if (typeof errorData === 'string') {
        errorMsg = errorData;
      } else if (error.message) {
        errorMsg = error.message;
      }
      showSnackbar(errorMsg, 'error');
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
              startIcon={showFilters ? <ChevronRightIcon /> : <FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {showFilters ? 'Hide' : 'Filters'}
            </Button>
          </Box>

          {showFilters && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={filters.role}
                    label="Role"
                    onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="TEC">Technician</MenuItem>
                    <MenuItem value="ADM">Administrator</MenuItem>
                    <MenuItem value="RES">Resident</MenuItem>
                    <MenuItem value="INT">Intern</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small" required>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={filters.department}
                    label="Department"
                    onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                  >
                    <MenuItem value=""><em>All Departments</em></MenuItem>
                    <MenuItem value="Cardiology">Cardiology</MenuItem>
                    <MenuItem value="Neurology">Neurology</MenuItem>
                    <MenuItem value="Pediatrics">Pediatrics</MenuItem>
                    <MenuItem value="Emergency">Emergency</MenuItem>
                    <MenuItem value="Surgery">Surgery</MenuItem>
                    <MenuItem value="Administration">Administration</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<ClearIcon />}
                  onClick={() => setFilters({
                    role: '',
                    department: ''
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
                      <Avatar sx={{ width: 36, height: 36, mr: 2, bgcolor: getStaffRoleColor(staff.role) + '.main' }}>
                        {staff.user?.first_name?.charAt(0) || staff.user?.username?.charAt(0) || 'S'}
                      </Avatar>
                      {staff.user?.first_name && staff.user?.last_name ? `${staff.user.first_name} ${staff.user.last_name}` : staff.user?.username}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={staff.role}
                      size="small"
                      color={getStaffRoleColor(staff.role)}
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
                      {staff.user?.email && (
                        <Typography variant="body2" color="textSecondary">
                          {staff.user.email}
                        </Typography>
                      )}
                      {staff.phone_number && (
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

      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 600 }}>
          {currentStaff?.id ? 'Edit Staff' : 'Add New Staff'}
        </DialogTitle>
        <DialogContent>

          <Box sx={{ mt: 2 }}>
            {!currentStaff?.id ? (
              <FormControl fullWidth margin="normal" required>
                <InputLabel id="user-select-label">Select User</InputLabel>
                <Select
                  labelId="user-select-label"
                  name="user"
                  value={currentStaff?.user || ''}
                  label="Select User"
                  onChange={handleInputChange}
                >
                  <MenuItem value="">
                    <em>Select a user</em>
                  </MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.username} ({user.first_name || ''} {user.last_name || ''}) - {user.email}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <>
                <TextField
                  label="Username (User)"
                  fullWidth
                  margin="normal"
                  value={currentStaff?.user?.username || ''}
                  disabled
                />
                <TextField
                  label="First Name (User)"
                  fullWidth
                  margin="normal"
                  value={currentStaff?.user?.first_name || ''}
                  disabled
                />
                <TextField
                  label="Last Name (User)"
                  fullWidth
                  margin="normal"
                  value={currentStaff?.user?.last_name || ''}
                  disabled
                />
                <TextField
                  label="Email (User)"
                  type="email"
                  fullWidth
                  margin="normal"
                  value={currentStaff?.user?.email || ''}
                  disabled
                />
              </>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Role</InputLabel>
                  <Select
                    name="role"
                    value={currentStaff?.role || ''}
                    label="Role"
                    onChange={handleInputChange}
                    required
                  >
                    <MenuItem value="TEC">Technician</MenuItem>
                    <MenuItem value="ADM">Administrator</MenuItem>
                    <MenuItem value="RES">Resident</MenuItem>
                    <MenuItem value="INT">Intern</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" required> 
                  <InputLabel>Department</InputLabel>
                  <Select
                    name="department"
                    value={currentStaff?.department || ''}
                    label="Department"
                    onChange={handleInputChange}
                    required
                  >
                    <MenuItem value="Cardiology">Cardiology</MenuItem>
                    <MenuItem value="Neurology">Neurology</MenuItem>
                    <MenuItem value="Pediatrics">Pediatrics</MenuItem>
                    <MenuItem value="Emergency">Emergency</MenuItem>
                    <MenuItem value="Surgery">Surgery</MenuItem>
                    <MenuItem value="Administration">Administration</MenuItem>
                    <MenuItem value="IT">IT Support</MenuItem>
                    <MenuItem value="Maintenance">Maintenance</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <TextField
              label="License Number (Optional)"
              name="license_number"
              fullWidth
              margin="normal"
              value={currentStaff?.license_number || ''}
              onChange={handleInputChange}
            />
            <TextField
              label="Specialization (Optional)"
              name="specialization"
              fullWidth
              margin="normal"
              value={currentStaff?.specialization || ''}
              onChange={handleInputChange}
            />
            <TextField
              label="Hire Date"
              name="hire_date"
              type="date"
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              value={currentStaff?.hire_date || new Date().toISOString().split('T')[0]}
              onChange={handleInputChange}
              required
            />
            <TextField
              label="Shift Schedule (Optional)"
              name="shift_schedule"
              fullWidth
              margin="normal"
              value={currentStaff?.shift_schedule || ''}
              onChange={handleInputChange}
            />
            <FormControlLabel
              control={<Switch checked={currentStaff?.is_active === undefined ? true : currentStaff.is_active} onChange={(e) => setCurrentStaff(prev => ({ ...prev, is_active: e.target.checked }))} name="is_active" />}
              label="Active Staff Member"
              sx={{ mt:1, display: 'block' }}
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

const getInventoryQuantityColor = (quantity) => {
  if (quantity < 10) return 'error';
  if (quantity < 20) return 'warning';
  return 'success';
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
    minQuantity: '',
    maxQuantity: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const fetchInventory = useCallback(async () => {
    try {
      const res = await apiClient.get(API_INVENTORY_BASE_URL);
      setInventory(res.data);
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Failed to fetch inventory', 'error');
    }
  }, [showSnackbar]);

  const filterInventory = useCallback(() => {
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

    if (filters.minQuantity) {
      result = result.filter(item => item.quantity >= parseInt(filters.minQuantity, 10));
    }

    if (filters.maxQuantity) {
      result = result.filter(item => item.quantity <= parseInt(filters.maxQuantity, 10));
    }

    setFilteredInventory(result);
  }, [inventory, searchTerm, filters]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  useEffect(() => {
    filterInventory();
  }, [filterInventory]);

  const handleOpenDialog = (item = null) => {
    setCurrentItem(item || {
      name: '',
      description: '',
      category: '',
      quantity: '',
      unit: '',
      minimum_stock: '',
      supplier: '',
      location: '' ,
      expiry_date: ''
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
      const payload = {
        ...currentItem,
        quantity: currentItem.quantity ? parseInt(currentItem.quantity) : 0,
        minimum_stock: currentItem.minimum_stock ? parseInt(currentItem.minimum_stock) : 0,
      };

      if (currentItem.id) {
        await apiClient.put(`${API_INVENTORY_BASE_URL}${currentItem.id}/`, payload);
        showSnackbar('Item updated successfully');
      } else {
        await apiClient.post(API_INVENTORY_BASE_URL, payload);
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
              startIcon={showFilters ? <ChevronRightIcon /> : <FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {showFilters ? 'Hide' : 'Filters'}
            </Button>
          </Box>

          {showFilters && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={filters.category}
                    label="Category"
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  >
                    <MenuItem value="">Tutte</MenuItem>
                    <MenuItem value="MED">Medication</MenuItem>
                    <MenuItem value="EQUIP">Equipment</MenuItem>
                    <MenuItem value="SUPP">Medical Supplies</MenuItem>
                    <MenuItem value="OTHER">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Min Quantity"
                  type="number"
                  size="small"
                  fullWidth
                  value={filters.minQuantity}
                  onChange={(e) => setFilters({ ...filters, minQuantity: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Max Quantity"
                  type="number"
                  size="small"
                  fullWidth
                  value={filters.maxQuantity}
                  onChange={(e) => setFilters({ ...filters, maxQuantity: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<ClearIcon />}
                  onClick={() => setFilters({
                    category: '',
                    minQuantity: '',
                    maxQuantity: ''
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
                <TableCell>Item Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInventory.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Typography fontWeight="medium">{item.name}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {item.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={item.category} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${item.quantity} ${item.unit}`}
                      size="small"
                      color={getInventoryQuantityColor(item.quantity)}
                    />
                  </TableCell>
                  <TableCell>
                    {item.supplier}
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
          {currentItem?.id ? 'Edit Inventory Item' : 'Add New Item'}
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
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Category</InputLabel>
                  <Select
                    name="category"
                    value={currentItem?.category || ''}
                    label="Category"
                    onChange={handleInputChange}
                    required
                  >
                    <MenuItem value="MED">Medication</MenuItem>
                    <MenuItem value="EQUIP">Equipment</MenuItem>
                    <MenuItem value="SUPP">Medical Supplies</MenuItem>
                    <MenuItem value="OTHER">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
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
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Unit"
                  name="unit"
                  fullWidth
                  margin="normal"
                  value={currentItem?.unit || ''} 
                  onChange={handleInputChange} 
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Minimum Stock"
                  name="minimum_stock"
                  type="number"
                  fullWidth
                  margin="normal"
                  value={currentItem?.minimum_stock || ''}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Supplier"
                  name="supplier"
                  fullWidth
                  margin="normal"
                  value={currentItem?.supplier || ''}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Location"
                  name="location"
                  fullWidth
                  margin="normal"
                  value={currentItem?.location || ''}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>
            <TextField
              label="Expiry Date (Optional)"
              name="expiry_date"
              type="date"
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              value={currentItem?.expiry_date || ''} 
              onChange={handleInputChange} 
              required
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

const Beds = () => {
  const [beds, setBeds] = useState([]);
  const [filteredBeds, setFilteredBeds] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentBed, setCurrentBed] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [filters, setFilters] = useState({
    status: '',
    location: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const showSnackbar = useCallback((message, severity = 'success') => setSnackbar({ open: true, message, severity }), []);

  const fetchBeds = useCallback(async () => {
    try {
      const res = await apiClient.get(API_BEDS_BASE_URL);
      setBeds(res.data);
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Failed to fetch beds', 'error');
    }
  }, [showSnackbar]);

  const filterBeds = useCallback(() => {
    let result = beds;

    if (searchTerm) {
      result = result.filter(bed =>
        bed.bed_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bed.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filters.status) {
      result = result.filter(bed => bed.status === filters.status);
    }
    if (filters.location) {
      result = result.filter(bed => bed.location?.toLowerCase().includes(filters.location.toLowerCase()));
    }
    setFilteredBeds(result);
  }, [beds, searchTerm, filters]);

  useEffect(() => {
    fetchBeds();
  }, [fetchBeds]);

  useEffect(() => {
    filterBeds();
  }, [filterBeds]);

  const handleOpenDialog = (bed = null) => {
    setCurrentBed(bed || {
      bed_number: '',
      status: 'AVAIL',
      location: '',
      is_isolation: false,
      special_equipment: '',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => setOpenDialog(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentBed(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async () => {
    try {
      if (currentBed.id) {
        await apiClient.put(`${API_BEDS_BASE_URL}${currentBed.id}/`, currentBed);
        showSnackbar('Bed updated successfully');
      } else {
        await apiClient.post(API_BEDS_BASE_URL, currentBed);
        showSnackbar('Bed added successfully');
      }
      fetchBeds();
      handleCloseDialog();
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Operation failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`${API_BEDS_BASE_URL}${id}/`);
      showSnackbar('Bed deleted successfully');
      fetchBeds();
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Delete failed', 'error');
    }
  };

  const handleCloseSnackbar = useCallback(() => setSnackbar(prev => ({ ...prev, open: false })), []);

  const bedStatusChoices = [
    { value: 'AVAIL', label: 'Available' },
    { value: 'OCCUP', label: 'Occupied' },
    { value: 'MAINT', label: 'Maintenance' },
    { value: 'RESERV', label: 'Reserved' },
  ];

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>Beds Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>New Bed</Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: showFilters ? 2 : 0 }}>
            <TextField placeholder="Search beds..." variant="outlined" size="small" fullWidth
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} sx={{ mr: 2 }}
            />
            <Button startIcon={showFilters ? <ChevronRightIcon /> : <FilterListIcon />} onClick={() => setShowFilters(!showFilters)}>
              {showFilters ? 'Hide' : 'Filters'}
            </Button>
          </Box>
          {showFilters && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select value={filters.status} label="Status" onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}>
                    <MenuItem value="">All</MenuItem>
                    {bedStatusChoices.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField label="Location" size="small" fullWidth value={filters.location} onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Button variant="outlined" fullWidth startIcon={<ClearIcon />} onClick={() => setFilters({ status: '', location: '' })}>Clear</Button>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
          <Table>
            <TableHead><TableRow><TableCell>Bed Number</TableCell><TableCell>Status</TableCell><TableCell>Location</TableCell><TableCell>Isolation</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
            <TableBody>
              {filteredBeds.map((bed) => (
                <TableRow key={bed.id} hover>
                  <TableCell>{bed.bed_number}</TableCell>
                  <TableCell><Chip label={bedStatusChoices.find(s => s.value === bed.status)?.label || bed.status} size="small" color={bed.status === 'AVAIL' ? 'success' : bed.status === 'OCCUP' ? 'error' : 'default'} /></TableCell>
                  <TableCell>{bed.location}</TableCell>
                  <TableCell>{bed.is_isolation ? 'Yes' : 'No'}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleOpenDialog(bed)} sx={{ color: 'primary.main' }}><EditIcon /></IconButton>
                    <IconButton onClick={() => handleDelete(bed.id)} sx={{ color: 'error.main' }}><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 600 }}>{currentBed?.id ? 'Edit Bed' : 'Add New Bed'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField label="Bed Number" name="bed_number" fullWidth margin="normal" value={currentBed?.bed_number || ''} onChange={handleInputChange} required />
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select name="status" value={currentBed?.status || 'AVAIL'} label="Status" onChange={handleInputChange} required>
                {bedStatusChoices.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Location" name="location" fullWidth margin="normal" value={currentBed?.location || ''} onChange={handleInputChange} required />
            <TextField label="Special Equipment (Optional)" name="special_equipment" fullWidth margin="normal" multiline rows={2} value={currentBed?.special_equipment || ''} onChange={handleInputChange} />
            <FormControlLabel
              control={<Switch checked={currentBed?.is_isolation || false} onChange={handleInputChange} name="is_isolation" />}
              label="Is Isolation Bed" sx={{ mt: 1, display: 'block' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary" sx={{ minWidth: 100 }}>{currentBed?.id ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </>
  );
};

const Visits = () => { 
  const { user } = useAuth();
  const [visits, setVisits] = useState([]);
  const [filteredVisits, setFilteredVisits] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentVisit, setCurrentVisit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [patients, setPatients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [availableBeds, setAvailableBeds] = useState([]);
  const [vitalSignsForVisit, setVitalSignsForVisit] = useState([]);
  const [openVitalSignDialog, setOpenVitalSignDialog] = useState(false);
  const [currentVitalSign, setCurrentVitalSign] = useState(null);
  const [treatmentsForVisit, setTreatmentsForVisit] = useState([]);
  const [openTreatmentDialog, setOpenTreatmentDialog] = useState(false);
  const [currentTreatment, setCurrentTreatment] = useState(null);
  const [diagnosesForVisit, setDiagnosesForVisit] = useState([]);
  const [openDiagnosisDialog, setOpenDiagnosisDialog] = useState(false);
  const [currentDiagnosis, setCurrentDiagnosis] = useState(null);
  const [prescriptionsForVisit, setPrescriptionsForVisit] = useState([]);
  const [openPrescriptionDialog, setOpenPrescriptionDialog] = useState(false);
  const [currentPrescription, setCurrentPrescription] = useState(null);

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const fetchVisits = useCallback(async () => {
    try {
      const res = await apiClient.get(API_VISITS_BASE_URL);
      setVisits(res.data);
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Failed to fetch visits', 'error');
    }
  }, [showSnackbar]);

  const fetchPatients = useCallback(async () => {
    try {
      const res = await apiClient.get(API_PATIENTS_BASE_URL);
      setPatients(res.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  }, []);

  const fetchStaff = useCallback(async () => {
    try {
      const res = await apiClient.get(API_STAFF_BASE_URL);
    } catch (error) {
      console.error('Error fetching staff:', error);
      // Optionally show snackbar here too if critical
    }
  }, []);

  useEffect(() => {
    fetchVisits();
    fetchPatients();
    fetchStaff();
  }, [fetchVisits, fetchPatients, fetchStaff]);


  const filterVisits = useCallback(() => {
    let result = visits;
    if (searchTerm) {
      result = result.filter(visit =>
        (visit.patient_id?.toString() || '').includes(searchTerm) ||
        (visit.chief_complaint || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (visit.attending_physician_id?.toString() || '').includes(searchTerm)
      );
    }
    setFilteredVisits(result);
  }, [visits, searchTerm, filters]);


  const fetchAvailableBeds = useCallback(async () => {
    try {
      const res = await apiClient.get(`${API_BEDS_BASE_URL}?status=AVAIL`);
      setAvailableBeds(res.data);
    } catch (error) {
      console.error('Error fetching available beds:', error);
      showSnackbar('Failed to fetch available beds', 'error');
    }
  }, [showSnackbar]);

  const fetchAdmissionDetails = useCallback(async (visitId) => {
    try {
      const res = await apiClient.get(`${API_ADMISSIONS_BASE_URL}?visit_id=${visitId}`);
      if (res.data && res.data.length > 0) {
        setCurrentVisit(prev => ({ ...prev, admissionDetails: res.data[0] }));
      } else {
        setCurrentVisit(prev => ({ ...prev, admissionDetails: null }));
      }
    } catch (error) {
      console.error('Error fetching admission details:', error);
      setCurrentVisit(prev => ({ ...prev, admissionDetails: null }));
    }
  }, []);

  const fetchSubModelsForVisit = useCallback(async (visitId) => {
    try {
      const [vitalsRes, treatmentsRes, diagnosesRes, prescriptionsRes] = await Promise.all([
        apiClient.get(`${API_VITALS_BASE_URL}?visit_id=${visitId}`),
        apiClient.get(`${API_TREATMENTS_BASE_URL}?visit_id=${visitId}`),
        apiClient.get(`${API_DIAGNOSES_BASE_URL}?visit_id=${visitId}`),
        apiClient.get(`${API_PRESCRIPTIONS_BASE_URL}?visit_id=${visitId}`)
      ]);
      setVitalSignsForVisit(vitalsRes.data);
      setTreatmentsForVisit(treatmentsRes.data);
      setDiagnosesForVisit(diagnosesRes.data);
      setPrescriptionsForVisit(prescriptionsRes.data);
    } catch (error) {
      console.error('Error fetching sub-models:', error);
    }
  }, []);

  useEffect(() => {
    filterVisits();
  }, [filterVisits]); 

  useEffect(() => {
    if (openDialog) {
      if (currentVisit?.id) {
        fetchSubModelsForVisit(currentVisit.id);
        if (currentVisit.is_admitted) {
          fetchAdmissionDetails(currentVisit.id);
        }
      }
      const shouldFetchBeds = (!currentVisit?.id && (currentVisit?.is_admitted === true || currentVisit?.is_admitted === undefined)) ||
                              (currentVisit?.id && currentVisit?.is_admitted === true);

      if (shouldFetchBeds) {
          fetchAvailableBeds();
      }
    }
  }, [openDialog, currentVisit, fetchSubModelsForVisit, fetchAdmissionDetails, fetchAvailableBeds]);


  const handleOpenDialog = (visit = null) => {
    setCurrentVisit(visit || {
      patient_id: '', 
      triage_level: 3, 
      chief_complaint: '',
      initial_observation: '',
      discharge_time: null,
      discharge_diagnosis: '',
      discharge_instructions: '',
      is_admitted: false,
      attending_physician_id: '',
      triage_nurse_id: '',
      admissionDetails: null,
    });
    if (!visit || !visit.is_admitted) {
      setCurrentVisit(prev => ({ ...prev, admissionDetails: null }));
    }
    setVitalSignsForVisit([]);
    setTreatmentsForVisit([]);
    setDiagnosesForVisit([]);
    setPrescriptionsForVisit([]);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "bed_id" || name === "admitting_diagnosis" || name === "department") {
      setCurrentVisit(prev => ({
        ...prev,
        admissionDetails: {
          ...(prev.admissionDetails || {}),
          [name]: value
        }
      }));
    } else {
      setCurrentVisit(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async () => {
    try {
      if (!currentVisit.patient_id) {
        showSnackbar('Patient is required.', 'error');
        return;
      }
      if (!currentVisit.chief_complaint) {
        showSnackbar('Chief complaint is required.', 'error');
        return;
      }
      if (!currentVisit.triage_level) {
        showSnackbar('Triage level is required.', 'error');
        return;
      }

      if (currentVisit.is_admitted && currentVisit.admissionDetails) {
        if (!currentVisit.admissionDetails.bed_id) {
            showSnackbar('Bed assignment is required for admitted patients.', 'error');
            return;
        }
        if (!currentVisit.admissionDetails.admitting_diagnosis) {
            showSnackbar('Admitting diagnosis is required for admitted patients.', 'error');
            return;
        }
      }
      const payload = {
        ...currentVisit,
        patient_id: currentVisit.patient_id ? parseInt(currentVisit.patient_id) : null,
        triage_level: currentVisit.triage_level ? parseInt(currentVisit.triage_level) : 3,
        attending_physician_id: currentVisit.attending_physician_id ? parseInt(currentVisit.attending_physician_id) : null,
        triage_nurse_id: currentVisit.triage_nurse_id ? parseInt(currentVisit.triage_nurse_id) : null,
        discharge_time: currentVisit.discharge_time || null,
        discharge_diagnosis: currentVisit.discharge_diagnosis || null,
        discharge_instructions: currentVisit.discharge_instructions || null,
      };

      if (currentVisit.id) {
        await apiClient.put(`${API_VISITS_BASE_URL}${currentVisit.id}/`, payload);
        showSnackbar('Visit updated successfully');

        if (currentVisit.is_admitted && currentVisit.admissionDetails) {
          const admissionPayload = {
            visit: currentVisit.id,
            bed: currentVisit.admissionDetails.bed_id ? parseInt(currentVisit.admissionDetails.bed_id) : null,
            admitting_diagnosis: currentVisit.admissionDetails.admitting_diagnosis,
            department: currentVisit.admissionDetails.department,
            admitted_by_id: user.id
          };
          if (currentVisit.admissionDetails.id) {
            await apiClient.put(`${API_ADMISSIONS_BASE_URL}${currentVisit.admissionDetails.id}/`, admissionPayload);
          } else {
            await apiClient.post(API_ADMISSIONS_BASE_URL, admissionPayload);
          }
        } else if (!currentVisit.is_admitted && currentVisit.admissionDetails?.id) {
        }
      } else {
        const visitRes = await apiClient.post(API_VISITS_BASE_URL, payload);
        const newVisitId = visitRes.data.id;
        showSnackbar('Visit added successfully');
        if (newVisitId && currentVisit.is_admitted && currentVisit.admissionDetails) {
           const admissionPayload = {
            visit: newVisitId,
            bed: currentVisit.admissionDetails.bed_id ? parseInt(currentVisit.admissionDetails.bed_id) : null,
            admitting_diagnosis: currentVisit.admissionDetails.admitting_diagnosis,
            department: currentVisit.admissionDetails.department,
            admitted_by_id: user.id
          };
          await apiClient.post(API_ADMISSIONS_BASE_URL, admissionPayload);
        }
      }
      fetchVisits();
      handleCloseDialog();
    } catch (error) {
      const errorData = error.response?.data;
      let errorMsg = 'Operation failed';

      if (errorData && typeof errorData === 'object') {
        const messages = Object.entries(errorData).map(([field, val]) => {
          if (typeof val === 'string') {
            return `${field}: ${val}`;
          } else if (Array.isArray(val)) {
            return `${field}: ${val.join(', ')}`;
          } else if (typeof val === 'object' && val !== null) {
            return `${field}: ${Object.entries(val).map(([subKey, subVal]) => `${subKey}: ${subVal}`).join(', ')}`;
          }
          return `${field}: Unrecognized error format`;
        });
        if (messages.length > 0) {
          errorMsg = messages.join('; ');
        } else {
           errorMsg = error.response?.statusText || 'Operation failed with unknown server error.';
        }
      } else if (typeof errorData === 'string' && errorData) {
        errorMsg = errorData;
      } else if (error.message) {
        errorMsg = error.message;
      }
      showSnackbar(errorMsg, 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`${API_VISITS_BASE_URL}${id}/`);
      showSnackbar('Visit deleted successfully');
      fetchVisits();
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Delete failed', 'error');
    }
  };

  const handleOpenVitalSignDialog = (vitalSign = null) => {
    setCurrentVitalSign(vitalSign || {
      visit: currentVisit.id,
      recorded_by_id: user.id,
      temperature: '',
      heart_rate: '',
      blood_pressure_systolic: '',
      blood_pressure_diastolic: '',
      respiratory_rate: '',
      oxygen_saturation: '',
      pain_level: '',
      gcs_score: '',
      notes: ''
    });
    setOpenVitalSignDialog(true);
  };

  const handleVitalSignSubmit = async () => {
    try {
      const payload = { ...currentVitalSign };
      ['temperature', 'heart_rate', 'blood_pressure_systolic', 'blood_pressure_diastolic',
       'respiratory_rate', 'oxygen_saturation', 'pain_level', 'gcs_score'].forEach(field => {
        payload[field] = payload[field] ? parseFloat(payload[field]) : null;
      });

      if (currentVitalSign.id) {
        await apiClient.put(`${API_VITALS_BASE_URL}${currentVitalSign.id}/`, payload);
      } else {
        await apiClient.post(API_VITALS_BASE_URL, payload);
      }
      fetchSubModelsForVisit(currentVisit.id);
      setOpenVitalSignDialog(false);
      showSnackbar('Vital sign saved successfully');
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Failed to save vital sign', 'error');
    }
  };

  const handleVitalSignDelete = async (id) => {
    try {
      await apiClient.delete(`${API_VITALS_BASE_URL}${id}/`);
      fetchSubModelsForVisit(currentVisit.id);
      showSnackbar('Vital sign deleted');
    } catch (error) {
      showSnackbar('Failed to delete vital sign', 'error');
    }
  };

  const handleOpenTreatmentDialog = (treatment = null) => {
    setCurrentTreatment(treatment || {
      visit: currentVisit.id,
      treatment_type: 'MED',
      name: '',
      description: '',
      administered_by_id: user.id,
      dosage: '',
      outcome: '',
      complications: ''
    });
    setOpenTreatmentDialog(true);
  };

  const handleTreatmentSubmit = async () => {
    try {
      if (currentTreatment.id) {
        await apiClient.put(`${API_TREATMENTS_BASE_URL}${currentTreatment.id}/`, currentTreatment);
      } else {
        await apiClient.post(API_TREATMENTS_BASE_URL, currentTreatment);
      }
      fetchSubModelsForVisit(currentVisit.id);
      setOpenTreatmentDialog(false);
      showSnackbar('Treatment saved successfully');
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Failed to save treatment', 'error');
    }
  };

  const handleTreatmentDelete = async (id) => {
    try {
      await apiClient.delete(`${API_TREATMENTS_BASE_URL}${id}/`);
      fetchSubModelsForVisit(currentVisit.id);
      showSnackbar('Treatment deleted');
    } catch (error) {
      showSnackbar('Failed to delete treatment', 'error');
    }
  };

  const handleOpenDiagnosisDialog = (diagnosis = null) => {
    setCurrentDiagnosis(diagnosis || {
      visit: currentVisit.id,
      code: '',
      description: '',
      diagnosed_by_id: user.id,
      is_primary: false,
      notes: ''
    });
    setOpenDiagnosisDialog(true);
  };

  const handleDiagnosisSubmit = async () => {
    try {
      if (currentDiagnosis.id) {
        await apiClient.put(`${API_DIAGNOSES_BASE_URL}${currentDiagnosis.id}/`, currentDiagnosis);
      } else {
        await apiClient.post(API_DIAGNOSES_BASE_URL, currentDiagnosis);
      }
      fetchSubModelsForVisit(currentVisit.id);
      setOpenDiagnosisDialog(false);
      showSnackbar('Diagnosis saved successfully');
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Failed to save diagnosis', 'error');
    }
  };

  const handleDiagnosisDelete = async (id) => {
    try {
      await apiClient.delete(`${API_DIAGNOSES_BASE_URL}${id}/`);
      fetchSubModelsForVisit(currentVisit.id);
      showSnackbar('Diagnosis deleted');
    } catch (error) {
      showSnackbar('Failed to delete diagnosis', 'error');
    }
  };

  const handleOpenPrescriptionDialog = (prescription = null) => {
    setCurrentPrescription(prescription || {
      visit: currentVisit.id,
      medication: '',
      dosage: '',
      frequency: '',
      duration: '',
      prescribed_by_id: user.id,
      instructions: '',
      is_dispensed: false,
      refills: 0
    });
    setOpenPrescriptionDialog(true);
  };

  const handlePrescriptionSubmit = async () => {
    try {
      const payload = {
        ...currentPrescription,
        refills: parseInt(currentPrescription.refills) || 0
      };
      if (currentPrescription.id) {
        await apiClient.put(`${API_PRESCRIPTIONS_BASE_URL}${currentPrescription.id}/`, payload);
      } else {
        await apiClient.post(API_PRESCRIPTIONS_BASE_URL, payload);
      }
      fetchSubModelsForVisit(currentVisit.id);
      setOpenPrescriptionDialog(false);
      showSnackbar('Prescription saved successfully');
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Failed to save prescription', 'error');
    }
  };

  const handlePrescriptionDelete = async (id) => {
    try {
      await apiClient.delete(`${API_PRESCRIPTIONS_BASE_URL}${id}/`);
      fetchSubModelsForVisit(currentVisit.id);
      showSnackbar('Prescription deleted');
    } catch (error) {
      showSnackbar('Failed to delete prescription', 'error');
    }
  };

  const handleSubModelInputChange = (e, modelSetter) => {
    const { name, value, type, checked } = e.target;
    modelSetter(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const triageLevelChoices = [
    {value: 1, label: '1 - Resuscitation (Immediate)'},
    {value: 2, label: '2 - Emergency (Very Urgent)'},
    {value: 3, label: '3 - Urgent'},
    {value: 4, label: '4 - Less Urgent'},
    {value: 5, label: '5 - Non-Urgent'},
  ];

  const treatmentTypeChoices = [
    {value: 'MED', label: 'Medication'},
    {value: 'PROC', label: 'Procedure'},
    {value: 'TEST', label: 'Diagnostic Test'},
    {value: 'OTHER', label: 'Other'},
  ];

  const getStaffNameById = (staffId) => {
    const staffMember = staff.find(s => s.id === staffId);
    if (!staffMember || !staffMember.user) return `ID: ${staffId}`;
    return `${staffMember.user.first_name || ''} ${staffMember.user.last_name || ''}`;
  };

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Emergency Visits
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          New Visit
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: showFilters ? 2 : 0 }}>
            <TextField
              placeholder="Search visits..."
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
              startIcon={showFilters ? <ChevronRightIcon /> : <FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {showFilters ? 'Hide' : 'Filters'}
            </Button>
          </Box>

          {showFilters && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    label="Status"
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value={"true"}>Admitted</MenuItem>
                    <MenuItem value={"false"}>Not Admitted</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
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
              <Grid item xs={12} sm={6} md={4}>
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
                    status: '',
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
                <TableCell>Arrival Time</TableCell>
                <TableCell>Triage Level</TableCell>
                <TableCell>Chief Complaint</TableCell>
                <TableCell>Admitted</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredVisits.map((visit) => (
                <TableRow key={visit.id} hover>
                  <TableCell>
                    <Typography fontWeight="medium">
                      {patients.find(p => p.id === visit.patient_id)?.first_name || 'Patient'}
                      {' '}
                      {patients.find(p => p.id === visit.patient_id)?.last_name || `ID: ${visit.patient_id}`}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(visit.arrival_time).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`Level ${visit.triage_level}`}
                      size="small"
                      color={visit.triage_level <= 2 ? 'error' : visit.triage_level === 3 ? 'warning' : 'info'}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography noWrap sx={{ maxWidth: 200 }}>
                      {visit.chief_complaint}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={visit.is_admitted ? "Admitted" : "Not Admitted"}
                      size="small"
                      color={visit.is_admitted ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={() => handleOpenDialog(visit)}
                      sx={{ color: 'primary.main' }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(visit.id)}
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
          {currentVisit?.id ? 'Edit Visit' : 'Add New Visit'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="patient-select-label">Patient</InputLabel>
                  <Select
                    labelId="patient-select-label"
                    name="patient_id"
                    value={currentVisit?.patient_id || ''}
                    label="Patient"
                    onChange={handleInputChange}
                    required
                  >
                    {patients.map(patient => (
                      <MenuItem key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name} (ID: {patient.id})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="triage-level-select-label">Triage Level</InputLabel>
                  <Select
                    labelId="triage-level-select-label"
                    name="triage_level"
                    value={currentVisit?.triage_level || 3}
                    label="Triage Level"
                    onChange={handleInputChange}
                    required
                  >
                    {triageLevelChoices.map(level => (
                      <MenuItem key={level.value} value={level.value}>{level.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <TextField
              label="Chief Complaint"
              name="chief_complaint"
              fullWidth
              margin="normal"
              multiline
              rows={2}
              value={currentVisit?.chief_complaint || ''}
              onChange={handleInputChange}
              required
            />

            <TextField
              label="Initial Observation"
              name="initial_observation"
              fullWidth
              margin="normal"
              multiline
              rows={3}
              value={currentVisit?.initial_observation || ''}
              onChange={handleInputChange}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="attending-physician-select-label">Attending Physician</InputLabel>
                  <Select
                    labelId="attending-physician-select-label"
                    name="attending_physician_id"
                    value={currentVisit?.attending_physician_id || ''}
                    label="Attending Physician"
                    onChange={handleInputChange}
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {staff.filter(s => ['RES', 'TEC', 'ADM'].includes(s.role)).map(doctor => (
                      <MenuItem key={doctor.id} value={doctor.id}>
                        {doctor.user?.first_name} {doctor.user?.last_name} (ID: {doctor.id})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="triage-nurse-select-label">Triage Nurse</InputLabel>
                  <Select
                    labelId="triage-nurse-select-label"
                    name="triage_nurse_id"
                    value={currentVisit?.triage_nurse_id || ''}
                    label="Triage Nurse"
                    onChange={handleInputChange}
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {staff.filter(s => ['TEC', 'INT', 'RES'].includes(s.role)).map(nurse => (
                      <MenuItem key={nurse.id} value={nurse.id}>
                        {nurse.user?.first_name} {nurse.user?.last_name} (ID: {nurse.id})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <FormControlLabel
              control={
                <Switch
                  checked={currentVisit?.is_admitted || false}
                  onChange={(e) => setCurrentVisit(prev => ({ ...prev, is_admitted: e.target.checked }))}
                  name="is_admitted"
                />
              }
              label="Patient Admitted"
              sx={{ mt: 1, display: 'block' }}
            />

            {currentVisit?.is_admitted && (
              <Box sx={{ mt: 2, p: 2, border: '1px dashed grey', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom>Admission Details</Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => fetchAvailableBeds()}
                  sx={{ mb: 2 }}
                >
                  Refresh Available Beds
                </Button>

                <FormControl fullWidth margin="normal">
                  <InputLabel id="bed-select-label">Assign Bed</InputLabel>
                  <Select
                    labelId="bed-select-label"
                    name="bed_id"
                    value={currentVisit?.admissionDetails?.bed_id || ''}
                    label="Assign Bed"
                    onChange={handleInputChange}
                  >
                    <MenuItem value=""><em>None / Not Assigned</em></MenuItem>
                    {availableBeds.map(bed => (
                      <MenuItem key={bed.id} value={bed.id}>
                        Bed {bed.bed_number} ({bed.location}) - {bed.status}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Admitting Diagnosis"
                  name="admitting_diagnosis"
                  fullWidth
                  margin="normal"
                  multiline
                  rows={2}
                  value={currentVisit?.admissionDetails?.admitting_diagnosis || ''}
                  onChange={handleInputChange}
                />

                <TextField
                  label="Department"
                  name="department"
                  fullWidth
                  margin="normal"
                  value={currentVisit?.admissionDetails?.department || ''}
                  onChange={handleInputChange}
                />
              </Box>
            )}

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Discharge Information</Typography>
            <TextField
              label="Discharge Time"
              name="discharge_time"
              type="datetime-local"
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              value={currentVisit?.discharge_time ? currentVisit.discharge_time.substring(0, 16) : ''}
              onChange={handleInputChange}
            />

            <TextField
              label="Discharge Diagnosis"
              name="discharge_diagnosis"
              fullWidth
              margin="normal"
              multiline
              rows={2}
              value={currentVisit?.discharge_diagnosis || ''}
              onChange={handleInputChange}
            />

            <TextField
              label="Discharge Instructions"
              name="discharge_instructions"
              fullWidth
              margin="normal"
              multiline
              rows={3}
              value={currentVisit?.discharge_instructions || ''}
              onChange={handleInputChange}
            />

            {currentVisit?.id && (
              <Box sx={{ mt: 3 }}>
                <Accordion sx={{ my: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Vital Signs</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Button
                      onClick={() => handleOpenVitalSignDialog()}
                      startIcon={<AddIcon />}
                      sx={{ mb: 1 }}
                    >
                      Add Vital Sign
                    </Button>
                    
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Time</TableCell>
                            <TableCell>Temp</TableCell>
                            <TableCell>HR</TableCell>
                            <TableCell>BP</TableCell>
                            <TableCell>O2</TableCell>
                            <TableCell>Pain</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {vitalSignsForVisit.map(vs => (
                            <TableRow key={vs.id}>
                              <TableCell>{new Date(vs.recorded_at).toLocaleTimeString()}</TableCell>
                              <TableCell>{vs.temperature}°C</TableCell>
                              <TableCell>{vs.heart_rate} bpm</TableCell>
                              <TableCell>{vs.blood_pressure_systolic}/{vs.blood_pressure_diastolic}</TableCell>
                              <TableCell>{vs.oxygen_saturation}%</TableCell>
                              <TableCell>{vs.pain_level}/10</TableCell>
                              <TableCell>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenVitalSignDialog(vs)}
                                >
                                  <EditIcon fontSize="small"/>
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleVitalSignDelete(vs.id)}
                                >
                                  <DeleteIcon fontSize="small"/>
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>

                <Accordion sx={{ my: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Treatments</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Button
                      onClick={() => handleOpenTreatmentDialog()}
                      startIcon={<AddIcon />}
                      sx={{ mb: 1 }}
                    >
                      Add Treatment
                    </Button>
                    
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Time</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Administered By</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {treatmentsForVisit.map(tr => (
                            <TableRow key={tr.id}>
                              <TableCell>{new Date(tr.administered_at).toLocaleTimeString()}</TableCell>
                              <TableCell>{treatmentTypeChoices.find(t => t.value === tr.treatment_type)?.label}</TableCell>
                              <TableCell>{tr.name}</TableCell>
                              <TableCell>{getStaffNameById(tr.administered_by_id)}</TableCell>
                              <TableCell>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenTreatmentDialog(tr)}
                                >
                                  <EditIcon fontSize="small"/>
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleTreatmentDelete(tr.id)}
                                >
                                  <DeleteIcon fontSize="small"/>
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>

                <Accordion sx={{ my: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Diagnoses</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Button
                      onClick={() => handleOpenDiagnosisDialog()}
                      startIcon={<AddIcon />}
                      sx={{ mb: 1 }}
                    >
                      Add Diagnosis
                    </Button>
                    
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Time</TableCell>
                            <TableCell>Code</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Primary</TableCell>
                            <TableCell>Diagnosed By</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {diagnosesForVisit.map(diag => (
                            <TableRow key={diag.id}>
                              <TableCell>{new Date(diag.diagnosed_at).toLocaleTimeString()}</TableCell>
                              <TableCell>{diag.code}</TableCell>
                              <TableCell sx={{ maxWidth: 200 }} noWrap>{diag.description}</TableCell>
                              <TableCell>{diag.is_primary ? 'Yes' : 'No'}</TableCell>
                              <TableCell>{getStaffNameById(diag.diagnosed_by_id)}</TableCell>
                              <TableCell>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenDiagnosisDialog(diag)}
                                >
                                  <EditIcon fontSize="small"/>
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDiagnosisDelete(diag.id)}
                                >
                                  <DeleteIcon fontSize="small"/>
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>

                <Accordion sx={{ my: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Prescriptions</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Button
                      onClick={() => handleOpenPrescriptionDialog()}
                      startIcon={<AddIcon />}
                      sx={{ mb: 1 }}
                    >
                      Add Prescription
                    </Button>
                    
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Time</TableCell>
                            <TableCell>Medication</TableCell>
                            <TableCell>Dosage</TableCell>
                            <TableCell>Prescribed By</TableCell>
                            <TableCell>Dispensed</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {prescriptionsForVisit.map(presc => (
                            <TableRow key={presc.id}>
                              <TableCell>{new Date(presc.prescribed_at).toLocaleTimeString()}</TableCell>
                              <TableCell>{presc.medication}</TableCell>
                              <TableCell>{presc.dosage}</TableCell>
                              <TableCell>{getStaffNameById(presc.prescribed_by_id)}</TableCell>
                              <TableCell>{presc.is_dispensed ? 'Yes' : 'No'}</TableCell>
                              <TableCell>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenPrescriptionDialog(presc)}
                                >
                                  <EditIcon fontSize="small"/>
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handlePrescriptionDelete(presc.id)}
                                >
                                  <DeleteIcon fontSize="small"/>
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
              </Box>
            )}
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
            {currentVisit?.id ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openVitalSignDialog} onClose={() => setOpenVitalSignDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>{currentVitalSign?.id ? 'Edit' : 'Add'} Vital Sign</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
                <TextField
                  label="Temperature (°C)"
                  name="temperature"
                  type="number"
                  fullWidth
                  margin="normal"
                  value={currentVitalSign?.temperature || ''}
                  onChange={(e) => handleSubModelInputChange(e, setCurrentVitalSign)}
                  inputProps={{ step: "0.1", min: "30", max: "45" }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Heart Rate (bpm)"
                  name="heart_rate"
                  type="number"
                  fullWidth
                  margin="normal"
                  value={currentVitalSign?.heart_rate || ''}
                  onChange={(e) => handleSubModelInputChange(e, setCurrentVitalSign)}
                  inputProps={{ min: "20", max: "300" }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Systolic BP (mmHg)"
                  name="blood_pressure_systolic"
                  type="number"
                  fullWidth
                  margin="normal"
                  value={currentVitalSign?.blood_pressure_systolic || ''}
                  onChange={(e) => handleSubModelInputChange(e, setCurrentVitalSign)}
                  inputProps={{ min: "50", max: "300" }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Diastolic BP (mmHg)"
                  name="blood_pressure_diastolic"
                  type="number"
                  fullWidth
                  margin="normal"
                  value={currentVitalSign?.blood_pressure_diastolic || ''}
                  onChange={(e) => handleSubModelInputChange(e, setCurrentVitalSign)}
                  inputProps={{ min: "30", max: "200" }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Respiratory Rate"
                  name="respiratory_rate"
                  type="number"
                  fullWidth
                  margin="normal"
                  value={currentVitalSign?.respiratory_rate || ''}
                  onChange={(e) => handleSubModelInputChange(e, setCurrentVitalSign)}
                  inputProps={{ min: "5", max: "60" }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="O2 Saturation (%)"
                  name="oxygen_saturation"
                  type="number"
                  fullWidth
                  margin="normal"
                  value={currentVitalSign?.oxygen_saturation || ''}
                  onChange={(e) => handleSubModelInputChange(e, setCurrentVitalSign)}
                  inputProps={{ min: "0", max: "100" }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Pain Level (0-10)"
                  name="pain_level"
                  type="number"
                  fullWidth
                  margin="normal"
                  value={currentVitalSign?.pain_level || ''}
                  onChange={(e) => handleSubModelInputChange(e, setCurrentVitalSign)}
                  inputProps={{ min: "0", max: "10" }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="GCS Score (3-15)"
                  name="gcs_score"
                  type="number"
                  fullWidth
                  margin="normal"
                  value={currentVitalSign?.gcs_score || ''}
                  onChange={(e) => handleSubModelInputChange(e, setCurrentVitalSign)}
                  inputProps={{ min: "3", max: "15" }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Notes"
                  name="notes"
                  fullWidth
                  margin="normal"
                  multiline
                  rows={2}
                  value={currentVitalSign?.notes || ''}
                  onChange={(e) => handleSubModelInputChange(e, setCurrentVitalSign)}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenVitalSignDialog(false)}>Cancel</Button>
          <Button onClick={handleVitalSignSubmit} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openTreatmentDialog} onClose={() => setOpenTreatmentDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>{currentTreatment?.id ? 'Edit' : 'Add'} Treatment</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Treatment Type</InputLabel>
              <Select
                name="treatment_type"
                value={currentTreatment?.treatment_type || 'MED'}
                label="Treatment Type"
                onChange={(e) => handleSubModelInputChange(e, setCurrentTreatment)}
              >
                {treatmentTypeChoices.map(type => (
                  <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              label="Name"
              name="name"
              fullWidth
              margin="normal"
              value={currentTreatment?.name || ''}
              onChange={(e) => handleSubModelInputChange(e, setCurrentTreatment)}
              required
            />

            <TextField
              label="Description"
              name="description"
              fullWidth
              margin="normal"
              multiline
              rows={3}
              value={currentTreatment?.description || ''}
              onChange={(e) => handleSubModelInputChange(e, setCurrentTreatment)}
            />

            {currentTreatment?.treatment_type === 'MED' && (
              <TextField
                label="Dosage"
                name="dosage"
                fullWidth
                margin="normal"
                value={currentTreatment?.dosage || ''}
                onChange={(e) => handleSubModelInputChange(e, setCurrentTreatment)}
              />
            )}

            <TextField
              label="Outcome"
              name="outcome"
              fullWidth
              margin="normal"
              multiline
              rows={2}
              value={currentTreatment?.outcome || ''}
              onChange={(e) => handleSubModelInputChange(e, setCurrentTreatment)}
            />

            <TextField
              label="Complications"
              name="complications"
              fullWidth
              margin="normal"
              multiline
              rows={2}
              value={currentTreatment?.complications || ''}
              onChange={(e) => handleSubModelInputChange(e, setCurrentTreatment)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTreatmentDialog(false)}>Cancel</Button>
          <Button onClick={handleTreatmentSubmit} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDiagnosisDialog} onClose={() => setOpenDiagnosisDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>{currentDiagnosis?.id ? 'Edit' : 'Add'} Diagnosis</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="ICD-10 Code"
              name="code"
              fullWidth
              margin="normal"
              value={currentDiagnosis?.code || ''}
              onChange={(e) => handleSubModelInputChange(e, setCurrentDiagnosis)}
              required
            />

            <TextField
              label="Description"
              name="description"
              fullWidth
              margin="normal"
              multiline
              rows={3}
              value={currentDiagnosis?.description || ''}
              onChange={(e) => handleSubModelInputChange(e, setCurrentDiagnosis)}
              required
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={currentDiagnosis?.is_primary || false}
                  onChange={(e) => handleSubModelInputChange(e, setCurrentDiagnosis)}
                  name="is_primary"
                />
              }
              label="Primary Diagnosis"
              sx={{ mt: 1 }}
            />

            <TextField
              label="Notes"
              name="notes"
              fullWidth
              margin="normal"
              multiline
              rows={2}
              value={currentDiagnosis?.notes || ''}
              onChange={(e) => handleSubModelInputChange(e, setCurrentDiagnosis)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDiagnosisDialog(false)}>Cancel</Button>
          <Button onClick={handleDiagnosisSubmit} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openPrescriptionDialog} onClose={() => setOpenPrescriptionDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>{currentPrescription?.id ? 'Edit' : 'Add'} Prescription</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Medication"
              name="medication"
              fullWidth
              margin="normal"
              value={currentPrescription?.medication || ''}
              onChange={(e) => handleSubModelInputChange(e, setCurrentPrescription)}
              required
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Dosage"
                  name="dosage"
                  fullWidth
                  margin="normal"
                  value={currentPrescription?.dosage || ''}
                  onChange={(e) => handleSubModelInputChange(e, setCurrentPrescription)}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Frequency"
                  name="frequency"
                  fullWidth
                  margin="normal"
                  value={currentPrescription?.frequency || ''}
                  onChange={(e) => handleSubModelInputChange(e, setCurrentPrescription)}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Duration"
                  name="duration"
                  fullWidth
                  margin="normal"
                  value={currentPrescription?.duration || ''}
                  onChange={(e) => handleSubModelInputChange(e, setCurrentPrescription)}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Refills"
                  name="refills"
                  type="number"
                  fullWidth
                  margin="normal"
                  value={currentPrescription?.refills || 0}
                  onChange={(e) => handleSubModelInputChange(e, setCurrentPrescription)}
                  inputProps={{ min: "0", max: "12" }}
                />
              </Grid>
            </Grid>

            <TextField
              label="Instructions"
              name="instructions"
              fullWidth
              margin="normal"
              multiline
              rows={2}
              value={currentPrescription?.instructions || ''}
              onChange={(e) => handleSubModelInputChange(e, setCurrentPrescription)}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={currentPrescription?.is_dispensed || false}
                  onChange={(e) => handleSubModelInputChange(e, setCurrentPrescription)}
                  name="is_dispensed"
                />
              }
              label="Medication Dispensed"
              sx={{ mt: 1 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPrescriptionDialog(false)}>Cancel</Button>
          <Button onClick={handlePrescriptionSubmit} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
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

const DiagnosesPage = () => {
  const [diagnoses, setDiagnoses] = useState([]);
  const [filteredDiagnoses, setFilteredDiagnoses] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentDiagnosis, setCurrentDiagnosis] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [filters, setFilters] = useState({ visit_id: '', diagnosed_by_id: '', is_primary: '' });
  const [showFilters, setShowFilters] = useState(false);

  const [visits, setVisits] = useState([]);
  const [patients, setPatients] = useState([]);
  const [staff, setStaff] = useState([]); // For diagnosed_by_id

  const showSnackbar = useCallback((message, severity = 'success') => setSnackbar({ open: true, message, severity }), []);

  const getVisitPatientName = useCallback((visitId) => {
    const visit = visits.find(v => v.id === visitId);
    if (!visit) return `Visit ID: ${visitId}`;
    const patient = patients.find(p => p.id === visit.patient_id);
    return patient ? `${patient.first_name} ${patient.last_name} (Visit #${visit.id})` : `Patient ID: ${visit.patient_id} (Visit #${visit.id})`;
  }, [visits, patients]);

  const getStaffName = useCallback((staffId) => {
    const staffMember = staff.find(s => s.id === staffId);
    if (!staffMember || !staffMember.user) return `Staff ID: ${staffId}`;
    return `${staffMember.user.first_name || ''} ${staffMember.user.last_name || staffMember.user.username}`;
  }, [staff]);

  useEffect(() => {
    let result = diagnoses;
    if (searchTerm) {
      result = result.filter(diag =>
        diag.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        diag.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getVisitPatientName(diag.visit)?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filters.visit_id) {
      result = result.filter(diag => diag.visit === parseInt(filters.visit_id));
    }
    if (filters.diagnosed_by_id) {
      result = result.filter(diag => diag.diagnosed_by_id === parseInt(filters.diagnosed_by_id));
    }
    if (filters.is_primary !== '') {
      result = result.filter(diag => diag.is_primary === (filters.is_primary === 'true'));
    }
    setFilteredDiagnoses(result);
  }, [diagnoses, searchTerm, filters, getVisitPatientName]); 

  const fetchDiagnoses = useCallback(async () => {
    try {
      const res = await apiClient.get(API_DIAGNOSES_BASE_URL);
      setDiagnoses(res.data);
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Failed to fetch diagnoses', 'error');
    }
  }, [showSnackbar]);

  const fetchVisits = useCallback(async () => {
    try {
      const res = await apiClient.get(API_VISITS_BASE_URL);
      setVisits(res.data);
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Failed to fetch visits', 'error');
    }
  }, [showSnackbar]);

  const fetchPatients = useCallback(async () => {
    try {
      const res = await apiClient.get(API_PATIENTS_BASE_URL);
      setPatients(res.data);
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Failed to fetch patients', 'error');
    }
  }, [showSnackbar]);

  const fetchStaff = useCallback(async () => {
    try {
      const res = await apiClient.get(API_STAFF_BASE_URL);
      setStaff(res.data.filter(s => ['RES', 'TEC', 'ADM'].includes(s.role))); 
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Failed to fetch staff (physicians)', 'error');
    }
  }, [showSnackbar]);

  useEffect(() => {
    fetchDiagnoses();
    fetchVisits();
    fetchPatients();
    fetchStaff();
  }, [fetchDiagnoses, fetchVisits, fetchPatients, fetchStaff]);

  const handleOpenDialog = (diagnosis = null) => {
    setCurrentDiagnosis(diagnosis || {
      visit: '',
      code: '',
      description: '',
      diagnosed_by_id: '',
      is_primary: false,
      notes: ''
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => setOpenDialog(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentDiagnosis(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async () => {
    if (!currentDiagnosis.visit || !currentDiagnosis.code || !currentDiagnosis.description || !currentDiagnosis.diagnosed_by_id) {
        showSnackbar('Visit, Code, Description, and Diagnosed By are required.', 'error');
        return;
    }
    try {
      const payload = {
        ...currentDiagnosis,
        visit: parseInt(currentDiagnosis.visit),
        diagnosed_by_id: parseInt(currentDiagnosis.diagnosed_by_id),
      };
      if (currentDiagnosis.id) {
        await apiClient.put(`${API_DIAGNOSES_BASE_URL}${currentDiagnosis.id}/`, payload);
        showSnackbar('Diagnosis updated successfully');
      } else {
        await apiClient.post(API_DIAGNOSES_BASE_URL, payload);
        showSnackbar('Diagnosis added successfully');
      }
      fetchDiagnoses();
      handleCloseDialog();
    } catch (error) {
      const errorData = error.response?.data;
      let errorMsg = 'Operation failed';
      if (errorData && typeof errorData === 'object') {
        errorMsg = Object.entries(errorData)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('; ');
      } else if (typeof errorData === 'string') {
        errorMsg = errorData;
      }
      showSnackbar(errorMsg, 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`${API_DIAGNOSES_BASE_URL}${id}/`);
      showSnackbar('Diagnosis deleted successfully');
      fetchDiagnoses();
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Delete failed', 'error');
    }
  };

  const handleCloseSnackbar = useCallback(() => setSnackbar(prev => ({ ...prev, open: false })), []);

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>Diagnoses Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>New Diagnosis</Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: showFilters ? 2 : 0 }}>
            <TextField
              placeholder="Search diagnoses (code, description, patient)..."
              variant="outlined" size="small" fullWidth
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} sx={{ mr: 2 }}
            />
            <Button startIcon={showFilters ? <ChevronRightIcon /> : <FilterListIcon />} onClick={() => setShowFilters(!showFilters)}>
              {showFilters ? 'Hide' : 'Filters'}
            </Button>
          </Box>
          {showFilters && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Visit (Patient)</InputLabel>
                  <Select value={filters.visit_id} label="Visit (Patient)" onChange={(e) => setFilters(prev => ({ ...prev, visit_id: e.target.value }))}>
                    <MenuItem value=""><em>All Visits</em></MenuItem>
                    {visits.map(v => <MenuItem key={v.id} value={v.id}>{getVisitPatientName(v.id)} - {new Date(v.arrival_time).toLocaleDateString()}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Diagnosed By</InputLabel>
                  <Select value={filters.diagnosed_by_id} label="Diagnosed By" onChange={(e) => setFilters(prev => ({ ...prev, diagnosed_by_id: e.target.value }))}>
                    <MenuItem value=""><em>All Staff</em></MenuItem>
                    {staff.map(s => <MenuItem key={s.id} value={s.id}>{getStaffName(s.id)}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Is Primary</InputLabel>
                  <Select value={filters.is_primary} label="Is Primary" onChange={(e) => setFilters(prev => ({ ...prev, is_primary: e.target.value }))}>
                    <MenuItem value=""><em>Any</em></MenuItem>
                    <MenuItem value="true">Yes</MenuItem>
                    <MenuItem value="false">No</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button variant="outlined" fullWidth startIcon={<ClearIcon />} onClick={() => setFilters({ visit_id: '', diagnosed_by_id: '', is_primary: '' })}>Clear</Button>
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
                <TableCell>Code</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Visit (Patient)</TableCell>
                <TableCell>Diagnosed At</TableCell>
                <TableCell>Diagnosed By</TableCell>
                <TableCell>Primary</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDiagnoses.map((diag) => (
                <TableRow key={diag.id} hover>
                  <TableCell>{diag.code}</TableCell>
                  <TableCell sx={{ maxWidth: 300 }}><Typography noWrap>{diag.description}</Typography></TableCell>
                  <TableCell>{getVisitPatientName(diag.visit)}</TableCell>
                  <TableCell>{new Date(diag.diagnosed_at).toLocaleString()}</TableCell>
                  <TableCell>{getStaffName(diag.diagnosed_by_id)}</TableCell>
                  <TableCell><Chip label={diag.is_primary ? 'Yes' : 'No'} size="small" color={diag.is_primary ? 'success' : 'default'} /></TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleOpenDialog(diag)} sx={{ color: 'primary.main' }}><EditIcon /></IconButton>
                    <IconButton onClick={() => handleDelete(diag.id)} sx={{ color: 'error.main' }}><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 600 }}>{currentDiagnosis?.id ? 'Edit Diagnosis' : 'Add New Diagnosis'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth margin="normal" required>
              <InputLabel id="visit-select-label">Visit (Patient & Time)</InputLabel>
              <Select
                labelId="visit-select-label"
                name="visit"
                value={currentDiagnosis?.visit || ''}
                label="Visit (Patient & Time)"
                onChange={handleInputChange}
              >
                {visits.map(v => (
                  <MenuItem key={v.id} value={v.id}>
                    {getVisitPatientName(v.id)} - Arrived: {new Date(v.arrival_time).toLocaleString()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="ICD-10 Code" name="code" fullWidth margin="normal" value={currentDiagnosis?.code || ''} onChange={handleInputChange} required />
            <TextField label="Description" name="description" fullWidth margin="normal" multiline rows={3} value={currentDiagnosis?.description || ''} onChange={handleInputChange} required />
            <FormControl fullWidth margin="normal" required>
              <InputLabel id="diagnosed-by-label">Diagnosed By</InputLabel>
              <Select
                labelId="diagnosed-by-label"
                name="diagnosed_by_id"
                value={currentDiagnosis?.diagnosed_by_id || ''}
                label="Diagnosed By"
                onChange={handleInputChange}
              >
                {staff.map(s => <MenuItem key={s.id} value={s.id}>{getStaffName(s.id)}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControlLabel
              control={<Checkbox checked={currentDiagnosis?.is_primary || false} onChange={handleInputChange} name="is_primary" />}
              label="Primary Diagnosis"
              sx={{ mt: 1, display: 'block' }}
            />
            <TextField label="Notes (Optional)" name="notes" fullWidth margin="normal" multiline rows={2} value={currentDiagnosis?.notes || ''} onChange={handleInputChange} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">{currentDiagnosis?.id ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </>
  );
};

const TreatmentsPage = () => {
  const [treatments, setTreatments] = useState([]);
  const [filteredTreatments, setFilteredTreatments] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentTreatment, setCurrentTreatment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [filters, setFilters] = useState({ visit_id: '', administered_by_id: '', treatment_type: '' });
  const [showFilters, setShowFilters] = useState(false);

  const [visits, setVisits] = useState([]);
  const [patients, setPatients] = useState([]);
  const [staff, setStaff] = useState([]); 

  const TREATMENT_TYPE_CHOICES = [
    { value: 'MED', label: 'Medication' },
    { value: 'PROC', label: 'Procedure' },
    { value: 'TEST', label: 'Diagnostic Test' },
    { value: 'OTHER', label: 'Other' },
  ];

  const showSnackbar = useCallback((message, severity = 'success') => setSnackbar({ open: true, message, severity }), []);

  const getVisitPatientName = useCallback((visitId) => {
    const visit = visits.find(v => v.id === visitId);
    if (!visit) return `Visit ID: ${visitId}`;
    const patient = patients.find(p => p.id === visit.patient_id);
    return patient ? `${patient.first_name} ${patient.last_name} (Visit #${visit.id})` : `Patient ID: ${visit.patient_id} (Visit #${visit.id})`;
  }, [visits, patients]);

  const getStaffName = useCallback((staffId) => {
    if (!staffId) return 'N/A';
    const staffMember = staff.find(s => s.id === staffId);
    if (!staffMember || !staffMember.user) return `Staff ID: ${staffId}`;
    return `${staffMember.user.first_name || ''} ${staffMember.user.last_name || staffMember.user.username}`;
  }, [staff]);

  useEffect(() => {
    let result = treatments;
    if (searchTerm) {
      result = result.filter(treat =>
        treat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        treat.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getVisitPatientName(treat.visit)?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filters.visit_id) {
      result = result.filter(treat => treat.visit === parseInt(filters.visit_id));
    }
    if (filters.administered_by_id) {
      result = result.filter(treat => treat.administered_by_id === parseInt(filters.administered_by_id));
    }
    if (filters.treatment_type) {
      result = result.filter(treat => treat.treatment_type === filters.treatment_type);
    }
    setFilteredTreatments(result);
  }, [treatments, searchTerm, filters, getVisitPatientName]);

  const fetchTreatments = useCallback(async () => {
    try {
      const res = await apiClient.get(API_TREATMENTS_BASE_URL);
      setTreatments(res.data);
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Failed to fetch treatments', 'error');
    }
  }, [showSnackbar]);

  const fetchVisits = useCallback(async () => {
    try {
      const res = await apiClient.get(API_VISITS_BASE_URL);
      setVisits(res.data);
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Failed to fetch visits', 'error');
    }
  }, [showSnackbar]);

  const fetchPatients = useCallback(async () => {
    try {
      const res = await apiClient.get(API_PATIENTS_BASE_URL);
      setPatients(res.data);
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Failed to fetch patients', 'error');
    }
  }, [showSnackbar]);

  const fetchStaff = useCallback(async () => {
    try {
      const res = await apiClient.get(API_STAFF_BASE_URL);
      setStaff(res.data.filter(s => ['RES', 'TEC', 'INT', 'ADM'].includes(s.role)));
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Failed to fetch staff', 'error');
    }
  }, [showSnackbar]);

  useEffect(() => {
    fetchTreatments();
    fetchVisits();
    fetchPatients();
    fetchStaff();
  }, [fetchTreatments, fetchVisits, fetchPatients, fetchStaff]);

  const handleOpenDialog = (treatment = null) => {
    setCurrentTreatment(treatment || {
      visit: '',
      treatment_type: 'MED',
      name: '',
      description: '',
      administered_by_id: '',
      dosage: '',
      outcome: '',
      complications: ''
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => setOpenDialog(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentTreatment(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!currentTreatment.visit || !currentTreatment.treatment_type || !currentTreatment.name || !currentTreatment.administered_by_id) {
        showSnackbar('Visit, Type, Name, and Administered By are required.', 'error');
        return;
    }
    try {
      const payload = {
        ...currentTreatment,
        visit: parseInt(currentTreatment.visit),
        administered_by_id: currentTreatment.administered_by_id ? parseInt(currentTreatment.administered_by_id) : null,
      };
      if (currentTreatment.id) {
        await apiClient.put(`${API_TREATMENTS_BASE_URL}${currentTreatment.id}/`, payload);
        showSnackbar('Treatment updated successfully');
      } else {
        await apiClient.post(API_TREATMENTS_BASE_URL, payload);
        showSnackbar('Treatment added successfully');
      }
      fetchTreatments();
      handleCloseDialog();
    } catch (error) {
      const errorData = error.response?.data;
      let errorMsg = 'Operation failed';
      if (errorData && typeof errorData === 'object') {
        errorMsg = Object.entries(errorData)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('; ');
      } else if (typeof errorData === 'string') {
        errorMsg = errorData;
      }
      showSnackbar(errorMsg, 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`${API_TREATMENTS_BASE_URL}${id}/`);
      showSnackbar('Treatment deleted successfully');
      fetchTreatments();
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Delete failed', 'error');
    }
  };

  const handleCloseSnackbar = useCallback(() => setSnackbar(prev => ({ ...prev, open: false })), []);

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>Treatments Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>New Treatment</Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: showFilters ? 2 : 0 }}>
              <TextField
                placeholder="Search treatments (name, description, patient)..."
                variant="outlined" size="small" fullWidth
                InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} sx={{ mr: 2 }}
              /> <Button startIcon={showFilters ? <ChevronRightIcon /> : <FilterListIcon />} onClick={() => setShowFilters(!showFilters)}>
                {showFilters ? 'Hide' : 'Filters'}
              </Button>
            </Box>
            {showFilters && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Visit (Patient)</InputLabel>
                    <Select value={filters.visit_id} label="Visit (Patient)" onChange={(e) => setFilters(prev => ({ ...prev, visit_id: e.target.value }))}>
                      <MenuItem value=""><em>All Visits</em></MenuItem>
                      {visits.map(v => <MenuItem key={v.id} value={v.id}>{getVisitPatientName(v.id)} - {new Date(v.arrival_time).toLocaleDateString()}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Administered By</InputLabel>
                    <Select value={filters.administered_by_id} label="Administered By" onChange={(e) => setFilters(prev => ({ ...prev, administered_by_id: e.target.value }))}>
                      <MenuItem value=""><em>All Staff</em></MenuItem>
                      {staff.map(s => <MenuItem key={s.id} value={s.id}>{getStaffName(s.id)}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Treatment Type</InputLabel>
                    <Select value={filters.treatment_type} label="Treatment Type" onChange={(e) => setFilters(prev => ({ ...prev, treatment_type: e.target.value }))}>
                      <MenuItem value=""><em>All Types</em></MenuItem>
                      {TREATMENT_TYPE_CHOICES.map(type => <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Button variant="outlined" fullWidth startIcon={<ClearIcon />} onClick={() => setFilters({ visit_id: '', administered_by_id: '', treatment_type: '' })}>Clear</Button>
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
        <TableCell>Type</TableCell>
        <TableCell>Visit (Patient)</TableCell>
        <TableCell>Administered At</TableCell>
        <TableCell>Administered By</TableCell>
        <TableCell>Outcome</TableCell>
        <TableCell align="right">Actions</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {filteredTreatments.map((treat) => (
        <TableRow key={treat.id} hover>
          <TableCell>{treat.name}</TableCell>
          <TableCell>{TREATMENT_TYPE_CHOICES.find(t => t.value === treat.treatment_type)?.label || treat.treatment_type}</TableCell>
          <TableCell>{getVisitPatientName(treat.visit)}</TableCell>
          <TableCell>{new Date(treat.administered_at).toLocaleString()}</TableCell>
          <TableCell>{getStaffName(treat.administered_by_id)}</TableCell>
          <TableCell sx={{ maxWidth: 200 }}><Typography noWrap>{treat.outcome || 'N/A'}</Typography></TableCell>
          <TableCell align="right">
            <IconButton onClick={() => handleOpenDialog(treat)} sx={{ color: 'primary.main' }}><EditIcon /></IconButton>
            <IconButton onClick={() => handleDelete(treat.id)} sx={{ color: 'error.main' }}><DeleteIcon /></IconButton>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>
</Card>

<Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="md">
<DialogTitle sx={{ fontWeight: 600 }}>{currentTreatment?.id ? 'Edit Treatment' : 'Add New Treatment'}</DialogTitle>
<DialogContent>
  <Box sx={{ mt: 2 }}>
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth margin="normal" required>
          <InputLabel id="visit-select-label">Visit (Patient & Time)</InputLabel>
          <Select labelId="visit-select-label" name="visit" value={currentTreatment?.visit || ''} label="Visit (Patient & Time)" onChange={handleInputChange}>
            {visits.map(v => <MenuItem key={v.id} value={v.id}>{getVisitPatientName(v.id)} - Arrived: {new Date(v.arrival_time).toLocaleString()}</MenuItem>)}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth margin="normal" required>
          <InputLabel id="treatment-type-label">Treatment Type</InputLabel>
          <Select labelId="treatment-type-label" name="treatment_type" value={currentTreatment?.treatment_type || 'MED'} label="Treatment Type" onChange={handleInputChange}>
            {TREATMENT_TYPE_CHOICES.map(type => <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>)}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
    <TextField label="Name of Treatment" name="name" fullWidth margin="normal" value={currentTreatment?.name || ''} onChange={handleInputChange} required />
    <TextField label="Detailed Description" name="description" fullWidth margin="normal" multiline rows={3} value={currentTreatment?.description || ''} onChange={handleInputChange} />
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth margin="normal" required>
          <InputLabel id="administered-by-label">Administered By</InputLabel>
          <Select labelId="administered-by-label" name="administered_by_id" value={currentTreatment?.administered_by_id || ''} label="Administered By" onChange={handleInputChange}>
            <MenuItem value=""><em>None</em></MenuItem>
            {staff.map(s => <MenuItem key={s.id} value={s.id}>{getStaffName(s.id)}</MenuItem>)}
          </Select>
        </FormControl>
      </Grid>
      {currentTreatment?.treatment_type === 'MED' && (
        <Grid item xs={12} sm={6}>
          <TextField label="Dosage (if medication)" name="dosage" fullWidth margin="normal" value={currentTreatment?.dosage || ''} onChange={handleInputChange} />
        </Grid>
      )}
    </Grid>
    <TextField label="Outcome of the Treatment" name="outcome" fullWidth margin="normal" multiline rows={2} value={currentTreatment?.outcome || ''} onChange={handleInputChange} />
    <TextField label="Any Complications" name="complications" fullWidth margin="normal" multiline rows={2} value={currentTreatment?.complications || ''} onChange={handleInputChange} />
  </Box>
</DialogContent>
<DialogActions>
  <Button onClick={handleCloseDialog}>Cancel</Button>
  <Button onClick={handleSubmit} variant="contained" color="primary">{currentTreatment?.id ? 'Update' : 'Add'}</Button>
</DialogActions>
</Dialog>

<Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
<Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
</Snackbar>
</>
);
};

const VitalSignsPage = () => {
  const [vitalSigns, setVitalSigns] = useState([]);
  const [filteredVitalSigns, setFilteredVitalSigns] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentVitalSign, setCurrentVitalSign] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [filters, setFilters] = useState({ visit_id: '', recorded_by_id: '', date_recorded: '' });
  const [showFilters, setShowFilters] = useState(false);

  const [visits, setVisits] = useState([]);
  const [patients, setPatients] = useState([]);
  const [staff, setStaff] = useState([]); // For recorded_by_id

  const showSnackbar = useCallback((message, severity = 'success') => setSnackbar({ open: true, message, severity }), []);

  const getVisitPatientName = useCallback((visitId) => { 
    const visit = visits.find(v => v.id === visitId);
    if (!visit) return `Visit ID: ${visitId}`;
    const patient = patients.find(p => p.id === visit.patient_id);
    return patient ? `${patient.first_name} ${patient.last_name} (Visit #${visit.id})` : `Patient ID: ${visit.patient_id} (Visit #${visit.id})`;
  }, [visits, patients]);

  const getStaffName = useCallback((staffId) => { 
    if (!staffId) return 'N/A';
    const staffMember = staff.find(s => s.id === staffId);
    if (!staffMember || !staffMember.user) return `Staff ID: ${staffId}`;
    return `${staffMember.user.first_name || ''} ${staffMember.user.last_name || staffMember.user.username}`;
  }, [staff]);

  useEffect(() => {
    let result = vitalSigns;
    if (searchTerm) {
      result = result.filter(vs =>
        getVisitPatientName(vs.visit)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vs.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filters.visit_id) {
      result = result.filter(vs => vs.visit === parseInt(filters.visit_id));
    }
    if (filters.recorded_by_id) {
      result = result.filter(vs => vs.recorded_by_id === parseInt(filters.recorded_by_id));
    }
    if (filters.date_recorded) {
      result = result.filter(vs => new Date(vs.recorded_at).toLocaleDateString() === new Date(filters.date_recorded).toLocaleDateString());
    }
    setFilteredVitalSigns(result);
  }, [vitalSigns, searchTerm, filters, getVisitPatientName]);

  const fetchVitalSigns = useCallback(async () => {
    try {
      const res = await apiClient.get(API_VITALS_BASE_URL);
      setVitalSigns(res.data);
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Failed to fetch vital signs', 'error');
    }
  }, [showSnackbar]);

  const fetchVisits = useCallback(async () => { 
    try {
      const res = await apiClient.get(API_VISITS_BASE_URL);
      setVisits(res.data);
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Failed to fetch visits', 'error');
    }
  }, [showSnackbar]);

  const fetchPatients = useCallback(async () => { 
    try {
      const res = await apiClient.get(API_PATIENTS_BASE_URL);
      setPatients(res.data);
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Failed to fetch patients', 'error');
    }
  }, [showSnackbar]);

  const fetchStaff = useCallback(async () => { 
    try {
      const res = await apiClient.get(API_STAFF_BASE_URL);
      setStaff(res.data.filter(s => ['RES', 'TEC', 'INT', 'ADM'].includes(s.role)));
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Failed to fetch staff', 'error');
    }
  }, [showSnackbar]);

  useEffect(() => {
    fetchVitalSigns();
    fetchVisits();
    fetchPatients();
    fetchStaff();
  }, [fetchVitalSigns, fetchVisits, fetchPatients, fetchStaff]);

  const handleOpenDialog = (vitalSign = null) => {
    setCurrentVitalSign(vitalSign || {
      visit: '',
      recorded_by_id: '',
      temperature: '', heart_rate: '', blood_pressure_systolic: '', blood_pressure_diastolic: '',
      respiratory_rate: '', oxygen_saturation: '', pain_level: '', gcs_score: '', notes: ''
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => setOpenDialog(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentVitalSign(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!currentVitalSign.visit || !currentVitalSign.recorded_by_id) {
        showSnackbar('Visit and Recorded By are required.', 'error');
        return;
    }
    try {
      const payload = {
        ...currentVitalSign,
        visit: parseInt(currentVitalSign.visit),
        recorded_by_id: currentVitalSign.recorded_by_id ? parseInt(currentVitalSign.recorded_by_id) : null,
      };
      ['temperature', 'heart_rate', 'blood_pressure_systolic', 'blood_pressure_diastolic', 
       'respiratory_rate', 'oxygen_saturation', 'pain_level', 'gcs_score'].forEach(field => {
        if (payload[field] === '' || payload[field] === undefined || payload[field] === null) {
            payload[field] = null;
        } else {
            const numValue = parseFloat(payload[field]);
            payload[field] = isNaN(numValue) ? null : numValue;
        }
      });

      if (currentVitalSign.id) {
        await apiClient.put(`${API_VITALS_BASE_URL}${currentVitalSign.id}/`, payload);
        showSnackbar('Vital sign updated successfully');
      } else {
        await apiClient.post(API_VITALS_BASE_URL, payload);
        showSnackbar('Vital sign added successfully');
      }
      fetchVitalSigns();
      handleCloseDialog();
    } catch (error) {
      const errorData = error.response?.data;
      let errorMsg = 'Operation failed';
      if (errorData && typeof errorData === 'object') {
        errorMsg = Object.entries(errorData)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('; ');
      } else if (typeof errorData === 'string') {
        errorMsg = errorData;
      }
      showSnackbar(errorMsg, 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`${API_VITALS_BASE_URL}${id}/`);
      showSnackbar('Vital sign deleted successfully');
      fetchVitalSigns();
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Delete failed', 'error');
    }
  };

  const handleCloseSnackbar = useCallback(() => setSnackbar(prev => ({ ...prev, open: false })), []);

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>Vital Signs Monitoring</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>New Vital Sign Record</Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: showFilters ? 2 : 0 }}>
            <TextField placeholder="Search by patient or notes..." variant="outlined" size="small" fullWidth
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} sx={{ mr: 2 }}
            />
            <Button startIcon={showFilters ? <ChevronRightIcon /> : <FilterListIcon />} onClick={() => setShowFilters(!showFilters)}>
              {showFilters ? 'Hide' : 'Filters'}
            </Button>
          </Box>
          {showFilters && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Visit (Patient)</InputLabel>
                  <Select value={filters.visit_id} label="Visit (Patient)" onChange={(e) => setFilters(prev => ({ ...prev, visit_id: e.target.value }))}>
                    <MenuItem value=""><em>All Visits</em></MenuItem>
                    {visits.map(v => <MenuItem key={v.id} value={v.id}>{getVisitPatientName(v.id)} - {new Date(v.arrival_time).toLocaleDateString()}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Recorded By</InputLabel>
                  <Select value={filters.recorded_by_id} label="Recorded By" onChange={(e) => setFilters(prev => ({ ...prev, recorded_by_id: e.target.value }))}>
                    <MenuItem value=""><em>All Staff</em></MenuItem>
                    {staff.map(s => <MenuItem key={s.id} value={s.id}>{getStaffName(s.id)}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField type="date" label="Date Recorded" size="small" fullWidth InputLabelProps={{ shrink: true }}
                  value={filters.date_recorded} onChange={(e) => setFilters(prev => ({ ...prev, date_recorded: e.target.value }))} />
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button variant="outlined" fullWidth startIcon={<ClearIcon />} onClick={() => setFilters({ visit_id: '', recorded_by_id: '', date_recorded: '' })}>Clear</Button>
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
                <TableCell>Visit (Patient)</TableCell>
                <TableCell>Recorded At</TableCell>
                <TableCell>Temp (°C)</TableCell>
                <TableCell>HR (bpm)</TableCell>
                <TableCell>BP (mmHg)</TableCell>
                <TableCell>O2 Sat (%)</TableCell>
                <TableCell>Pain (0-10)</TableCell>
                <TableCell>GCS (3-15)</TableCell>
                <TableCell>Recorded By</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredVitalSigns.map((vs) => (
                <TableRow key={vs.id} hover>
                  <TableCell>{getVisitPatientName(vs.visit)}</TableCell>
                  <TableCell>{new Date(vs.recorded_at).toLocaleString()}</TableCell>
                  <TableCell>{vs.temperature !== null ? vs.temperature : '-'}</TableCell>
                  <TableCell>{vs.heart_rate !== null ? vs.heart_rate : '-'}</TableCell>
                  <TableCell>{vs.blood_pressure_systolic && vs.blood_pressure_diastolic ? `${vs.blood_pressure_systolic}/${vs.blood_pressure_diastolic}` : '-'}</TableCell>
                  <TableCell>{vs.oxygen_saturation !== null ? vs.oxygen_saturation : '-'}</TableCell>
                  <TableCell>{vs.pain_level !== null ? vs.pain_level : '-'}</TableCell>
                  <TableCell>{vs.gcs_score !== null ? vs.gcs_score : '-'}</TableCell>
                  <TableCell>{getStaffName(vs.recorded_by_id)}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleOpenDialog(vs)} sx={{ color: 'primary.main' }}><EditIcon /></IconButton>
                    <IconButton onClick={() => handleDelete(vs.id)} sx={{ color: 'error.main' }}><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 600 }}>{currentVitalSign?.id ? 'Edit Vital Sign' : 'Add New Vital Sign Record'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" required>
                  <InputLabel>Visit (Patient & Time)</InputLabel>
                  <Select name="visit" value={currentVitalSign?.visit || ''} label="Visit (Patient & Time)" onChange={handleInputChange}>
                    {visits.map(v => <MenuItem key={v.id} value={v.id}>{getVisitPatientName(v.id)} - Arrived: {new Date(v.arrival_time).toLocaleString()}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" required>
                  <InputLabel>Recorded By</InputLabel>
                  <Select name="recorded_by_id" value={currentVitalSign?.recorded_by_id || ''} label="Recorded By" onChange={handleInputChange}>
                     <MenuItem value=""><em>None</em></MenuItem>
                    {staff.map(s => <MenuItem key={s.id} value={s.id}>{getStaffName(s.id)}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={4}><TextField label="Temperature (°C)" name="temperature" type="number" inputProps={{ step: "0.1" }} fullWidth margin="normal" value={currentVitalSign?.temperature || ''} onChange={handleInputChange} /></Grid>
              <Grid item xs={6} sm={4}><TextField label="Heart Rate (bpm)" name="heart_rate" type="number" fullWidth margin="normal" value={currentVitalSign?.heart_rate || ''} onChange={handleInputChange} /></Grid>
              <Grid item xs={6} sm={4}><TextField label="Systolic BP (mmHg)" name="blood_pressure_systolic" type="number" fullWidth margin="normal" value={currentVitalSign?.blood_pressure_systolic || ''} onChange={handleInputChange} /></Grid>
              <Grid item xs={6} sm={4}><TextField label="Diastolic BP (mmHg)" name="blood_pressure_diastolic" type="number" fullWidth margin="normal" value={currentVitalSign?.blood_pressure_diastolic || ''} onChange={handleInputChange} /></Grid>
              <Grid item xs={6} sm={4}><TextField label="Respiratory Rate" name="respiratory_rate" type="number" fullWidth margin="normal" value={currentVitalSign?.respiratory_rate || ''} onChange={handleInputChange} /></Grid>
              <Grid item xs={6} sm={4}><TextField label="O2 Saturation (%)" name="oxygen_saturation" type="number" inputProps={{ min: "0", max: "100" }} fullWidth margin="normal" value={currentVitalSign?.oxygen_saturation || ''} onChange={handleInputChange} /></Grid>
              <Grid item xs={6} sm={4}><TextField label="Pain Level (0-10)" name="pain_level" type="number" inputProps={{ min: "0", max: "10" }} fullWidth margin="normal" value={currentVitalSign?.pain_level || ''} onChange={handleInputChange} /></Grid>
              <Grid item xs={6} sm={4}><TextField label="GCS Score (3-15)" name="gcs_score" type="number" inputProps={{ min: "3", max: "15" }} fullWidth margin="normal" value={currentVitalSign?.gcs_score || ''} onChange={handleInputChange} /></Grid>
              <Grid item xs={12}><TextField label="Additional Notes" name="notes" fullWidth margin="normal" multiline rows={3} value={currentVitalSign?.notes || ''} onChange={handleInputChange} /></Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">{currentVitalSign?.id ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </>
  );
};

const PrescriptionsPage = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentPrescription, setCurrentPrescription] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [filters, setFilters] = useState({ visit_id: '', prescribed_by_id: '', is_dispensed: '' });
  const [showFilters, setShowFilters] = useState(false);

  const [visits, setVisits] = useState([]);
  const [patients, setPatients] = useState([]);
  const [staff, setStaff] = useState([]); // For prescribed_by_id

  const showSnackbar = useCallback((message, severity = 'success') => setSnackbar({ open: true, message, severity }), []);

  const getVisitPatientName = useCallback((visitId) => { 
    const visit = visits.find(v => v.id === visitId);
    if (!visit) return `Visit ID: ${visitId}`;
    const patient = patients.find(p => p.id === visit.patient_id);
    return patient ? `${patient.first_name} ${patient.last_name} (Visit #${visit.id})` : `Patient ID: ${visit.patient_id} (Visit #${visit.id})`;
  }, [visits, patients]);

  const getStaffName = useCallback((staffId) => { 
    if (!staffId) return 'N/A';
    const staffMember = staff.find(s => s.id === staffId);
    if (!staffMember || !staffMember.user) return `Staff ID: ${staffId}`;
    return `${staffMember.user.first_name || ''} ${staffMember.user.last_name || staffMember.user.username}`;
  }, [staff]);

  useEffect(() => {
    let result = prescriptions;
    if (searchTerm) {
      result = result.filter(presc =>
        presc.medication.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getVisitPatientName(presc.visit)?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filters.visit_id) {
      result = result.filter(presc => presc.visit === parseInt(filters.visit_id));
    }
    if (filters.prescribed_by_id) {
      result = result.filter(presc => presc.prescribed_by_id === parseInt(filters.prescribed_by_id));
    }
    if (filters.is_dispensed !== '') {
      result = result.filter(presc => presc.is_dispensed === (filters.is_dispensed === 'true'));
    }
    setFilteredPrescriptions(result);
  }, [prescriptions, searchTerm, filters, getVisitPatientName]);

  const fetchPrescriptions = useCallback(async () => {
    try {
      const res = await apiClient.get(API_PRESCRIPTIONS_BASE_URL);
      setPrescriptions(res.data);
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Failed to fetch prescriptions', 'error');
    }
  }, [showSnackbar]);

  const fetchVisits = useCallback(async () => { 
    try {
      const res = await apiClient.get(API_VISITS_BASE_URL);
      setVisits(res.data);
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Failed to fetch visits', 'error');
    }
  }, [showSnackbar]);

  const fetchPatients = useCallback(async () => { 
    try {
      const res = await apiClient.get(API_PATIENTS_BASE_URL);
      setPatients(res.data);
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Failed to fetch patients', 'error');
    }
  }, [showSnackbar]);

  const fetchStaff = useCallback(async () => { 
    try {
      const res = await apiClient.get(API_STAFF_BASE_URL);
      setStaff(res.data.filter(s => ['RES', 'ADM'].includes(s.role)));
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Failed to fetch staff (prescribers)', 'error');
    }
  }, [showSnackbar]);

  useEffect(() => {
    fetchPrescriptions();
    fetchVisits();
    fetchPatients();
    fetchStaff();
  }, [fetchPrescriptions, fetchVisits, fetchPatients, fetchStaff]);

  const handleOpenDialog = (prescription = null) => {
    setCurrentPrescription(prescription || {
      visit: '', medication: '', dosage: '', frequency: '', duration: '',
      prescribed_by_id: '', instructions: '', is_dispensed: false, refills: 0
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => setOpenDialog(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentPrescription(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async () => {
    if (!currentPrescription.visit || !currentPrescription.medication || !currentPrescription.dosage || !currentPrescription.frequency || !currentPrescription.duration || !currentPrescription.prescribed_by_id) {
        showSnackbar('Visit, Medication, Dosage, Frequency, Duration, and Prescribed By are required.', 'error');
        return;
    }
    try {
      const payload = {
        ...currentPrescription,
        visit: parseInt(currentPrescription.visit),
        prescribed_by_id: currentPrescription.prescribed_by_id ? parseInt(currentPrescription.prescribed_by_id) : null,
        refills: parseInt(currentPrescription.refills) || 0,
      };
      if (currentPrescription.id) {
        await apiClient.put(`${API_PRESCRIPTIONS_BASE_URL}${currentPrescription.id}/`, payload);
        showSnackbar('Prescription updated successfully');
      } else {
        await apiClient.post(API_PRESCRIPTIONS_BASE_URL, payload);
        showSnackbar('Prescription added successfully');
      }
      fetchPrescriptions();
      handleCloseDialog();
    } catch (error) {
      const errorData = error.response?.data;
      let errorMsg = 'Operation failed';
      if (errorData && typeof errorData === 'object') {
        errorMsg = Object.entries(errorData)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('; ');
      } else if (typeof errorData === 'string') {
        errorMsg = errorData;
      }
      showSnackbar(errorMsg, 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`${API_PRESCRIPTIONS_BASE_URL}${id}/`);
      showSnackbar('Prescription deleted successfully');
      fetchPrescriptions();
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Delete failed', 'error');
    }
  };

  const handleCloseSnackbar = useCallback(() => setSnackbar(prev => ({ ...prev, open: false })), []);

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>Prescriptions Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>New Prescription</Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: showFilters ? 2 : 0 }}>
            <TextField placeholder="Search prescriptions (medication, patient)..." variant="outlined" size="small" fullWidth
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} sx={{ mr: 2 }}
            />
            <Button startIcon={showFilters ? <ChevronRightIcon /> : <FilterListIcon />} onClick={() => setShowFilters(!showFilters)}>
              {showFilters ? 'Hide' : 'Filters'}
            </Button>
          </Box>
          {showFilters && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Visit (Patient)</InputLabel>
                  <Select value={filters.visit_id} label="Visit (Patient)" onChange={(e) => setFilters(prev => ({ ...prev, visit_id: e.target.value }))}>
                    <MenuItem value=""><em>All Visits</em></MenuItem>
                    {visits.map(v => <MenuItem key={v.id} value={v.id}>{getVisitPatientName(v.id)} - {new Date(v.arrival_time).toLocaleDateString()}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Prescribed By</InputLabel>
                  <Select value={filters.prescribed_by_id} label="Prescribed By" onChange={(e) => setFilters(prev => ({ ...prev, prescribed_by_id: e.target.value }))}>
                    <MenuItem value=""><em>All Staff</em></MenuItem>
                    {staff.map(s => <MenuItem key={s.id} value={s.id}>{getStaffName(s.id)}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Dispensed</InputLabel>
                  <Select value={filters.is_dispensed} label="Dispensed" onChange={(e) => setFilters(prev => ({ ...prev, is_dispensed: e.target.value }))}>
                    <MenuItem value=""><em>Any</em></MenuItem>
                    <MenuItem value="true">Yes</MenuItem>
                    <MenuItem value="false">No</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button variant="outlined" fullWidth startIcon={<ClearIcon />} onClick={() => setFilters({ visit_id: '', prescribed_by_id: '', is_dispensed: '' })}>Clear</Button>
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
                <TableCell>Medication</TableCell>
                <TableCell>Visit (Patient)</TableCell>
                <TableCell>Prescribed At</TableCell>
                <TableCell>Prescribed By</TableCell>
                <TableCell>Dosage</TableCell>
                <TableCell>Dispensed</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPrescriptions.map((presc) => (
                <TableRow key={presc.id} hover>
                  <TableCell>{presc.medication}</TableCell>
                  <TableCell>{getVisitPatientName(presc.visit)}</TableCell>
                  <TableCell>{new Date(presc.prescribed_at).toLocaleString()}</TableCell>
                  <TableCell>{getStaffName(presc.prescribed_by_id)}</TableCell>
                  <TableCell>{presc.dosage}</TableCell>
                  <TableCell><Chip label={presc.is_dispensed ? 'Yes' : 'No'} size="small" color={presc.is_dispensed ? 'success' : 'default'} /></TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleOpenDialog(presc)} sx={{ color: 'primary.main' }}><EditIcon /></IconButton>
                    <IconButton onClick={() => handleDelete(presc.id)} sx={{ color: 'error.main' }}><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 600 }}>{currentPrescription?.id ? 'Edit Prescription' : 'Add New Prescription'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" required>
                  <InputLabel>Visit (Patient & Time)</InputLabel>
                  <Select name="visit" value={currentPrescription?.visit || ''} label="Visit (Patient & Time)" onChange={handleInputChange}>
                    {visits.map(v => <MenuItem key={v.id} value={v.id}>{getVisitPatientName(v.id)} - Arrived: {new Date(v.arrival_time).toLocaleString()}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" required>
                  <InputLabel>Prescribed By</InputLabel>
                  <Select name="prescribed_by_id" value={currentPrescription?.prescribed_by_id || ''} label="Prescribed By" onChange={handleInputChange}>
                    <MenuItem value=""><em>None</em></MenuItem>
                    {staff.map(s => <MenuItem key={s.id} value={s.id}>{getStaffName(s.id)}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <TextField label="Medication Name" name="medication" fullWidth margin="normal" value={currentPrescription?.medication || ''} onChange={handleInputChange} required />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}><TextField label="Dosage (e.g., 500mg)" name="dosage" fullWidth margin="normal" value={currentPrescription?.dosage || ''} onChange={handleInputChange} required /></Grid>
              <Grid item xs={12} sm={6} md={3}><TextField label="Frequency (e.g., 3 times a day)" name="frequency" fullWidth margin="normal" value={currentPrescription?.frequency || ''} onChange={handleInputChange} required /></Grid>
              <Grid item xs={12} sm={6} md={3}><TextField label="Duration (e.g., 7 days)" name="duration" fullWidth margin="normal" value={currentPrescription?.duration || ''} onChange={handleInputChange} required /></Grid>
              <Grid item xs={12} sm={6} md={3}><TextField label="Refills" name="refills" type="number" inputProps={{ min: "0" }} fullWidth margin="normal" value={currentPrescription?.refills || 0} onChange={handleInputChange} /></Grid>
            </Grid>
            <TextField label="Additional Instructions" name="instructions" fullWidth margin="normal" multiline rows={3} value={currentPrescription?.instructions || ''} onChange={handleInputChange} />
            <FormControlLabel control={<Checkbox checked={currentPrescription?.is_dispensed || false} onChange={handleInputChange} name="is_dispensed" />} label="Medication Dispensed" sx={{ mt: 1, display: 'block' }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">{currentPrescription?.id ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
                  <Visits />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          <Route
            path="/beds"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Beds />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          <Route
            path="/diagnoses"
            element={
              <ProtectedRoute>
                <DashboardLayout><DiagnosesPage /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/treatments"
            element={
              <ProtectedRoute>
                <DashboardLayout><TreatmentsPage /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vitalsigns"
            element={
              <ProtectedRoute>
                <DashboardLayout><VitalSignsPage /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/prescriptions"
            element={
              <ProtectedRoute>
                <DashboardLayout><PrescriptionsPage /></DashboardLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;