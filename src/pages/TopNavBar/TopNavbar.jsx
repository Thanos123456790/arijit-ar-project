import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Popover,
  Typography,
  Box,
  Button,
  Badge,
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import MailIcon from "@mui/icons-material/Mail";
import CloseIcon from "@mui/icons-material/Close";
import { useLocation, useNavigate } from "react-router-dom";

const CHAT_API = `${import.meta.env.VITE_API_URL}/chats`;

export default function TopNavbar() {
  const location   = useLocation();
  const navigate   = useNavigate();
  const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));

  /* popover */
  const [anchorEl, setAnchorEl] = useState(null);
  const open  = Boolean(anchorEl);
  const popId = open ? "user-pop" : undefined;
  const logout = () => {
    sessionStorage.clear();              // token + user
    setAnchorEl(null);
    navigate("/");
  };

  /* ─── unread badge state ─── */
  const [unread, setUnread] = useState(0);
  const lastSeenKey = `chatLastSeen_${currentUser?._id}`;

  /* fetch unread count every 5 s */
  useEffect(() => {
    if (!currentUser) return;
    const fetchUnread = async () => {
      const since = localStorage.getItem(lastSeenKey) || "";
      const res   = await fetch(`${CHAT_API}?since=${since}`);
      const data  = await res.json();
      const unseen = data.filter(m => m.senderId !== currentUser._id).length;
      setUnread(unseen);
    };
    fetchUnread();
    const id = setInterval(fetchUnread, 5000);
    return () => clearInterval(id);
  }, [currentUser, lastSeenKey]);

  /* hide on landing page */
  if (location.pathname === "/") return null;

  /* open chat */
  const openChat = () => {
    localStorage.setItem(lastSeenKey, new Date().toISOString()); // reset counter
    setUnread(0);
    navigate("/ems-integrated-chat");
  };

  return (
    <>
      <AppBar
        position="fixed"
        color="primary"
        style={{
          zIndex: 1300,
          height: "55px",
          borderRadius: "10px",
        }}
      >
        <Toolbar sx={{ position: "relative", height: "55px", px: 2 }}>
          {/* Center-Aligned Title */}
          <Box
            sx={{
              position: "absolute",
              left: 0,
              right: 0,
              textAlign: "center",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Exam Handling System
            </Typography>
          </Box>

          {/* Right-Aligned Icons */}
          <Box
            sx={{
              marginLeft: "auto",
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
            }}
          >
            <IconButton
              onClick={openChat}
              sx={{ width: "50px" }}
              size="large"
              color="inherit"
            >
              <Badge badgeContent={unread} color="error">
                <MailIcon />
              </Badge>
            </IconButton>
            <IconButton
              sx={{ width: "50px" }}
              onClick={e=>setAnchorEl(e.currentTarget)}
              color="inherit"
            >
              <AccountCircleIcon sx={{ fontSize: 32 }} />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Popover
        id={popId}
        open={open}
        anchorEl={anchorEl}
        onClose={()=>setAnchorEl(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        sx={{ mt: 1 }}
      >
        <Box sx={{ p: 2, minWidth: 220 }}>
          <Typography variant="subtitle1">
            <strong>User Name:</strong> {currentUser?.name}
          </Typography>
          <Typography variant="body2">
            <strong>Email:</strong> {currentUser?.email}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>Role:</strong> {currentUser?.role}
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            fullWidth
            startIcon={<CloseIcon />}
            onClick={logout}
          >
            Logout
          </Button>
          <br />
          <br />
          <Button
            variant="contained"
            color="secondary"
            fullWidth
            startIcon={<AccountCircleIcon />}
            onClick={()=>{ setAnchorEl(null); navigate("/profile"); }}
          >
            Manage Profile
          </Button>
        </Box>
      </Popover>
    </>
  );
};