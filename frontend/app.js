// =========================
// PROFILE — LOAD & SAVE (FIXED)
// =========================

const profileForm = document.getElementById("profile-form");

if (profileForm) {
  const usernameInput = document.getElementById("profile-username");
  const emailInput = document.getElementById("profile-email");

  let authUser = null;

  // Load profile data
  auth.onAuthStateChanged((user) => {
    if (!user) return;
    authUser = user;

    db.collection("users").doc(user.uid).get()
      .then((doc) => {
        if (!doc.exists) return;

        const data = doc.data();
        usernameInput.value = data.username || "";
        emailInput.value = data.email || user.email;
      })
      .catch((err) => console.error(err));
  });

  // Save profile data
  profileForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!authUser) return;

    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();

    // Basic validation (abuse-safe)
    if (username.length < 2 || username.length > 30) {
      alert("Username must be between 2 and 30 characters.");
      return;
    }

    if (!email.includes("@")) {
      alert("Please enter a valid email.");
      return;
    }

    Promise.all([
      // Auth profile
      authUser.updateProfile({ displayName: username }),

      // Email update (Auth)
      email !== authUser.email
        ? authUser.updateEmail(email)
        : Promise.resolve(),

      // Firestore profile
      db.collection("users").doc(authUser.uid).update({
        username: username,
        email: email,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      })
    ])
    .then(() => {
      alert("Profile updated successfully!");
    })
    .catch((err) => {
      alert(err.message);
    });
  });
}
