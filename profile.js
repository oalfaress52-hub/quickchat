(function initProfilePage() {
  const nicknameValue = document.getElementById("nicknameValue");
  const emailValue = document.getElementById("emailValue");
  const descriptionValue = document.getElementById("descriptionValue");
  const profileAvatar = document.getElementById("profileAvatar");
  const chatBtn = document.getElementById("chatBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const profileMsg = document.getElementById("profileMsg");
  const nicknameEditInput = document.getElementById("nicknameEditInput");
  const saveNicknameBtn = document.getElementById("saveNicknameBtn");
  const nicknameChangesLeft = document.getElementById("nicknameChangesLeft");

  let currentUser = null;
  let userRef = null;
  let changesUsed = 0;

  function profileLetter(value) {
    return String(value || "").trim().charAt(0).toLowerCase() || "a";
  }

  function showMessage(text) {
    profileMsg.textContent = text;
    profileMsg.classList.remove("hidden");
  }

  function updateRemainingText() {
    const left = Math.max(0, 15 - changesUsed);
    nicknameChangesLeft.textContent = `Changes left: ${left}`;
    saveNicknameBtn.disabled = left <= 0;
  }

  async function loadProfileData(user) {
    const fallbackNickname = user.displayName || "Anonymous";
    nicknameValue.textContent = fallbackNickname;
    emailValue.textContent = user.email || "-";
    descriptionValue.textContent = "No description yet.";
    profileAvatar.src = `images/pfp/${profileLetter(fallbackNickname)}.png`;

    const snap = await userRef.get();
    if (!snap.exists) {
      updateRemainingText();
      return;
    }

    const data = snap.data();
    const nickname = data.nickname || fallbackNickname;
    const letter = profileLetter(nickname);

    nicknameValue.textContent = nickname;
    emailValue.textContent = data.email || user.email || "-";
    descriptionValue.textContent = data.description || "No description yet.";
    profileAvatar.src = data.profilePicture || `images/pfp/${letter}.png`;
    changesUsed = Number(data.nicknameChanges) || 0;
    updateRemainingText();
  }

  saveNicknameBtn.onclick = async () => {
    if (!currentUser || !userRef) return;

    const newNickname = nicknameEditInput.value.trim();
    if (!newNickname) {
      showMessage("Please enter a nickname.");
      return;
    }
    if (newNickname.length > 15) {
      showMessage("Nickname max is 15 characters.");
      return;
    }
    if (changesUsed >= 15) {
      showMessage("Nickname change limit reached (15)." );
      return;
    }

    const nextChanges = changesUsed + 1;
    const profilePicture = `images/pfp/${profileLetter(newNickname)}.png`;

    try {
      await currentUser.updateProfile({ displayName: newNickname });
      await userRef.set({
        nickname: newNickname,
        nicknameChanges: nextChanges,
        profilePicture
      }, { merge: true });

      changesUsed = nextChanges;
      nicknameValue.textContent = newNickname;
      profileAvatar.src = profilePicture;
      nicknameEditInput.value = "";
      updateRemainingText();
      showMessage("Nickname updated.");
    } catch (error) {
      console.error(error);
      showMessage(`Could not update nickname: ${error.message || "unknown error"}`);
    }
  };

  firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    currentUser = user;
    userRef = firebase.firestore().collection("users").doc(user.uid);

    try {
      await loadProfileData(user);
    } catch (error) {
      console.error(error);
      showMessage("Could not load profile details.");
    }

    chatBtn.onclick = () => {
      window.location.href = "server.html";
    };

    logoutBtn.onclick = async () => {
      await firebase.auth().signOut();
      window.location.href = "login.html";
    };
  });
})();
