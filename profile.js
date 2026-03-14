(function initProfilePage() {
  const nicknameValue = document.getElementById("nicknameValue");
  const handleValue = document.getElementById("handleValue");
  const descriptionValue = document.getElementById("descriptionValue");
  const profileAvatar = document.getElementById("profileAvatar");
  const profileFeed = document.getElementById("profileFeed");
  const profileMsg = document.getElementById("profileMsg");

  const editProfileBtn = document.getElementById("editProfileBtn");
  const editPanel = document.getElementById("editPanel");
  const saveProfileBtn = document.getElementById("saveProfileBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");

  const nicknameEditInput = document.getElementById("nicknameEditInput");
  const handleEditInput = document.getElementById("handleEditInput");
  const descriptionEditInput = document.getElementById("descriptionEditInput");

  const nicknameChangesLeft = document.getElementById("nicknameChangesLeft");
  const handleChangesLeft = document.getElementById("handleChangesLeft");
  const descriptionChangesLeft = document.getElementById("descriptionChangesLeft");

  const windsTabBtn = document.getElementById("windsTabBtn");
  const repliesTabBtn = document.getElementById("repliesTabBtn");

  const goHomeBtn = document.getElementById("goHomeBtn");
  const goExploreBtn = document.getElementById("goExploreBtn");
  const goFeedBtn = document.getElementById("goFeedBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  const MAX_CHANGES = 15;
  let currentUser = null;
  let userRef = null;
  let activeTab = "winds";

  const profileState = {
    nickname: "",
    handle: "",
    description: "",
    nicknameChanges: 0,
    handleChanges: 0,
    descriptionChanges: 0,
    profilePicture: ""
  };

  function letterForAvatar(value) {
    return String(value || "").trim().charAt(0).toLowerCase() || "a";
  }

  function normalizeHandle(value) {
    const raw = String(value || "").trim().replace(/^@+/, "");
    return raw.replace(/[^a-zA-Z0-9._]/g, "").toLowerCase();
  }

  function setMessage(text) {
    profileMsg.textContent = text;
    profileMsg.classList.remove("hidden");
  }

  function hideMessage() {
    profileMsg.classList.add("hidden");
  }

  function updateChangeLabels() {
    nicknameChangesLeft.textContent = `Nickname changes left: ${Math.max(0, MAX_CHANGES - profileState.nicknameChanges)}`;
    handleChangesLeft.textContent = `@ changes left: ${Math.max(0, MAX_CHANGES - profileState.handleChanges)}`;
    descriptionChangesLeft.textContent = `Description changes left: ${Math.max(0, MAX_CHANGES - profileState.descriptionChanges)}`;
  }

  function applyProfileToUI() {
    nicknameValue.textContent = profileState.nickname;
    handleValue.textContent = `@${profileState.handle || "user"}`;
    descriptionValue.textContent = profileState.description || "No description yet.";
    profileAvatar.src = profileState.profilePicture;

    nicknameEditInput.value = profileState.nickname;
    handleEditInput.value = `@${profileState.handle}`;
    descriptionEditInput.value = profileState.description;
    updateChangeLabels();
  }

  function setActiveTab(tab) {
    activeTab = tab;
    windsTabBtn.classList.toggle("active", tab === "winds");
    repliesTabBtn.classList.toggle("active", tab === "replies");
    renderProfileFeed();
  }

  function createFeedCard(title, meta, body) {
    const card = document.createElement("article");
    card.className = "profile-feed-card";

    const heading = document.createElement("h4");
    heading.textContent = title;

    const metaEl = document.createElement("p");
    metaEl.className = "profile-feed-meta";
    metaEl.textContent = meta;

    const bodyEl = document.createElement("p");
    bodyEl.className = "profile-feed-text";
    bodyEl.textContent = body;

    card.appendChild(heading);
    card.appendChild(metaEl);
    card.appendChild(bodyEl);
    return card;
  }

  async function loadUserWinds() {
    const labels = [profileState.nickname, currentUser.displayName, currentUser.email]
      .map((v) => String(v || "").trim())
      .filter(Boolean);

    const seen = new Set();
    const allDocs = [];
    for (const label of labels) {
      const snap = await firebase.firestore()
        .collection("winds")
        .where("user", "==", label)
        .orderBy("time", "desc")
        .limit(100)
        .get();

      snap.forEach((doc) => {
        if (!seen.has(doc.id)) {
          seen.add(doc.id);
          allDocs.push({ id: doc.id, ...doc.data() });
        }
      });
    }

    allDocs.sort((a, b) => {
      const ta = a.time?.toMillis ? a.time.toMillis() : 0;
      const tb = b.time?.toMillis ? b.time.toMillis() : 0;
      return tb - ta;
    });

    return allDocs;
  }

  async function loadReplies() {
    const labels = [profileState.nickname, currentUser.displayName, currentUser.email]
      .map((v) => String(v || "").trim())
      .filter(Boolean);

    const replies = [];
    for (const label of labels) {
      try {
        const snap = await firebase.firestore()
          .collectionGroup("comments")
          .where("user", "==", label)
          .orderBy("time", "desc")
          .limit(120)
          .get();

        snap.forEach((doc) => {
          replies.push({
            id: doc.id,
            path: doc.ref.path,
            ...doc.data()
          });
        });
      } catch (error) {
        // If collectionGroup index/rules fail, continue gracefully.
      }
    }

    replies.sort((a, b) => {
      const ta = a.time?.toMillis ? a.time.toMillis() : 0;
      const tb = b.time?.toMillis ? b.time.toMillis() : 0;
      return tb - ta;
    });

    return replies;
  }

  async function renderProfileFeed() {
    profileFeed.innerHTML = "";

    try {
      if (activeTab === "winds") {
        const winds = await loadUserWinds();
        if (!winds.length) {
          profileFeed.innerHTML = '<p class="profile-empty">No winds yet.</p>';
          return;
        }

        winds.forEach((wind) => {
          const date = window.formatTimestamp ? window.formatTimestamp(wind.time) : "now";
          profileFeed.appendChild(createFeedCard("Wind", date, wind.text || ""));
        });
      } else {
        const replies = await loadReplies();
        if (!replies.length) {
          profileFeed.innerHTML = '<p class="profile-empty">No replies yet.</p>';
          return;
        }

        replies.forEach((reply) => {
          const date = window.formatTimestamp ? window.formatTimestamp(reply.time) : "now";
          profileFeed.appendChild(createFeedCard("Reply", `${date} · ${reply.path}`, reply.text || ""));
        });
      }
    } catch (error) {
      console.error(error);
      profileFeed.innerHTML = '<p class="profile-empty">Could not load this tab right now.</p>';
    }
  }

  async function saveProfileChanges() {
    hideMessage();

    const newNickname = nicknameEditInput.value.trim();
    const newHandle = normalizeHandle(handleEditInput.value);
    const newDescription = descriptionEditInput.value.trim();

    if (!newNickname) {
      setMessage("Nickname cannot be empty.");
      return;
    }
    if (!newHandle) {
      setMessage("@ handle cannot be empty.");
      return;
    }

    const updates = {};

    if (newNickname !== profileState.nickname) {
      if (profileState.nicknameChanges >= MAX_CHANGES) {
        setMessage("Nickname change limit reached.");
        return;
      }
      updates.nickname = newNickname;
      updates.nicknameChanges = profileState.nicknameChanges + 1;
      updates.profilePicture = `images/pfp/${letterForAvatar(newNickname)}.png`;
      await currentUser.updateProfile({ displayName: newNickname });
    }

    if (newHandle !== profileState.handle) {
      if (profileState.handleChanges >= MAX_CHANGES) {
        setMessage("@ handle change limit reached.");
        return;
      }
      updates.handle = newHandle;
      updates.handleChanges = profileState.handleChanges + 1;
    }

    if (newDescription !== profileState.description) {
      if (profileState.descriptionChanges >= MAX_CHANGES) {
        setMessage("Description change limit reached.");
        return;
      }
      updates.description = newDescription;
      updates.descriptionChanges = profileState.descriptionChanges + 1;
    }

    if (!Object.keys(updates).length) {
      setMessage("No changes to save.");
      return;
    }

    await userRef.set(updates, { merge: true });

    Object.assign(profileState, {
      ...profileState,
      nickname: updates.nickname ?? profileState.nickname,
      handle: updates.handle ?? profileState.handle,
      description: updates.description ?? profileState.description,
      nicknameChanges: updates.nicknameChanges ?? profileState.nicknameChanges,
      handleChanges: updates.handleChanges ?? profileState.handleChanges,
      descriptionChanges: updates.descriptionChanges ?? profileState.descriptionChanges,
      profilePicture: updates.profilePicture ?? profileState.profilePicture
    });

    applyProfileToUI();
    editPanel.classList.add("hidden");
    setMessage("Profile saved.");
    renderProfileFeed();
  }

  firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    currentUser = user;
    userRef = firebase.firestore().collection("users").doc(user.uid);

    const snap = await userRef.get();
    const data = snap.exists ? snap.data() : {};

    const nickname = data.nickname || user.displayName || "Anonymous";
    const handle = data.handle || normalizeHandle(nickname + (user.uid || "").slice(0, 5)) || "user";
    const profilePicture = data.profilePicture || `images/pfp/${letterForAvatar(nickname)}.png`;

    Object.assign(profileState, {
      nickname,
      handle,
      description: data.description || "",
      nicknameChanges: Number(data.nicknameChanges) || 0,
      handleChanges: Number(data.handleChanges) || 0,
      descriptionChanges: Number(data.descriptionChanges) || 0,
      profilePicture
    });

    if (!snap.exists || !data.handle) {
      await userRef.set({
        nickname,
        handle,
        profilePicture,
        nicknameChanges: Number(data.nicknameChanges) || 0,
        handleChanges: Number(data.handleChanges) || 0,
        descriptionChanges: Number(data.descriptionChanges) || 0
      }, { merge: true });
    }

    applyProfileToUI();
    setActiveTab("winds");

    goHomeBtn.addEventListener("click", () => {
      window.location.href = "server.html";
    });

    goExploreBtn.addEventListener("click", () => {
      window.location.href = "server.html";
    });

    goFeedBtn.addEventListener("click", () => {
      window.location.href = "server.html";
    });

    editProfileBtn.addEventListener("click", () => {
      editPanel.classList.toggle("hidden");
    });

    cancelEditBtn.addEventListener("click", () => {
      editPanel.classList.add("hidden");
      applyProfileToUI();
      hideMessage();
    });

    saveProfileBtn.addEventListener("click", async () => {
      try {
        await saveProfileChanges();
      } catch (error) {
        console.error(error);
        setMessage(`Could not save profile: ${error.message || "unknown error"}`);
      }
    });

    windsTabBtn.addEventListener("click", () => setActiveTab("winds"));
    repliesTabBtn.addEventListener("click", () => setActiveTab("replies"));

    logoutBtn.addEventListener("click", async () => {
      await firebase.auth().signOut();
      window.location.href = "login.html";
    });
  });
})();
