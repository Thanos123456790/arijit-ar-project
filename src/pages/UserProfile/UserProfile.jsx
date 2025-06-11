import React, { useEffect, useState, useRef } from "react";
import {
  Avatar,
  Box,
  Button,
  Container,
  Grid,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "./UserProfile.css";

const API = `${import.meta.env.VITE_API_URL}/users`;

export default function UserProfile() {
  const navigate = useNavigate();

  /* -----------------------------------------------------------
     1.  Read current user ONCE (not on every render!)
         We keep it in a ref so that its identity never changes,
         preventing the useEffect dependency from firing forever.
  ----------------------------------------------------------- */
  const currentUserRef = useRef(
    JSON.parse(sessionStorage.getItem("currentUser") || "{}")
  );
  const currentUser = currentUserRef.current;

  /* -----------------------------------------------------------
     2.  Local state for profile form + avatar preview
  ----------------------------------------------------------- */
  const [preview, setPreview] = useState(null);
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    role: "",
    phone: "",
    dob: "",
    bio: "",
    address: "",
    gender: "",
    image: null,
  });

  /* -----------------------------------------------------------
     3.  Initialise form data exactly once on mount
  ----------------------------------------------------------- */
  useEffect(() => {
    if (currentUser._id) {
      setProfile({
        fullName: currentUser.name || "",
        email: currentUser.email || "",
        role: currentUser.role || "",
        phone: currentUser.phone || "",
        dob: currentUser.dateOfBirth
          ? dayjs(currentUser.dateOfBirth).format("YYYY-MM-DD")
          : "",
        bio: currentUser.bio || "",
        address: currentUser.address || "",
        gender: currentUser.gender || "",
        image: currentUser.image || null,
      });
      setPreview(currentUser.image || null);
    }
  }, []); //  <-- empty dependency array (runs once)

  /* -----------------------------------------------------------
     4.  Field handlers
  ----------------------------------------------------------- */
  const onChange = (e) =>
    setProfile({ ...profile, [e.target.name]: e.target.value });

  const onImg = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      setProfile((p) => ({ ...p, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  /* -----------------------------------------------------------
     5.  Save profile
  ----------------------------------------------------------- */
  const save = async () => {
    const payload = {
      name: profile.fullName,
      phone: profile.phone,
      dateOfBirth: profile.dob,
      bio: profile.bio,
      address: profile.address,
      gender: profile.gender,
      image: profile.image,
    };

    // console.log("data",payload);

    try {
      const res = await fetch(`${API}/${currentUser._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        return alert(err.error || "Update failed");
      }

      const updated = await res.json();
      sessionStorage.setItem("currentUser", JSON.stringify(updated));
      alert("Profile saved!");

      navigate(
        updated.role === "teacher"
          ? "/teacher-home"
          : updated.role === "admin"
          ? "/admin-home"
          : "/student-home"
      );
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  /* -----------------------------------------------------------
     6.  UI
  ----------------------------------------------------------- */
  return (
    <Container sx={{ width: { xs: "100%", md: "60%" } }}>
      <Paper elevation={4} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight="bold" align="center" gutterBottom>
          My Profile
        </Typography>

        {/* Avatar & uploader */}
        <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
          <Avatar src={preview} sx={{ width: 100, height: 100, mb: 2 }} />
          <Button variant="contained" component="label" size="small">
            Upload Photo
            <input hidden accept="image/*" type="file" onChange={onImg} />
          </Button>
        </Box>

        {/* Form */}
        <Grid container spacing={2}>
          <Grid item md={6} xs={12}>
            <TextField
              name="fullName"
              label="Full Name"
              fullWidth
              value={profile.fullName}
              onChange={onChange}
            />
          </Grid>

          <Grid item md={6} xs={12}>
            <TextField
              name="email"
              label="Email"
              fullWidth
              value={profile.email}
              InputProps={{ readOnly: true }}
            />
          </Grid>

          <Grid item md={2} xs={6}>
            <TextField
              name="role"
              label="Role"
              fullWidth
              value={profile.role}
              InputProps={{ readOnly: true }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              name="phone"
              label="Phone"
              fullWidth
              value={profile.phone}
              onChange={onChange}
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              name="dob"
              label="Date of Birth"
              type="date"
              fullWidth
              value={profile.dob}
              onChange={onChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              name="address"
              label="Address"
              fullWidth
              value={profile.address}
              onChange={onChange}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              name="bio"
              label="Bio"
              fullWidth
              multiline
              minRows={2}
              value={profile.bio}
              onChange={onChange}
            />
          </Grid>
        </Grid>

        {/* Save button */}
        <Box mt={4} display="flex" justifyContent="center">
          <Button variant="contained" sx={{ width: "50%" }} onClick={save}>
            Save Profile
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
