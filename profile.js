(function initProfilePage() {
  const reportLoadStatus = window.reportLoadStatus || ((name, error) => {
    if (error) {
      console.error(`error "${name}" didnt load ❌`, error);
    } else {
      console.info(`"${name}" succesfully loaded ✔`);
    }
  });

  const nicknameValue = document.getElementById("nicknameValue");
  const handleValue = document.getElementById("handleValue");
  const descriptionValue = document.getElementById("descriptionValue");
  const profileMetaValue = document.getElementById("profileMetaValue");
  const profileInterests = document.getElementById("profileInterests");
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
  const favoriteFoodEditInput = document.getElementById("favoriteFoodEditInput");
  const favoriteSportEditInput = document.getElementById("favoriteSportEditInput");

  const nicknameChangesLeft = document.getElementById("nicknameChangesLeft");
  const handleChangesLeft = document.getElementById("handleChangesLeft");
  const descriptionChangesLeft = document.getElementById("descriptionChangesLeft");

  const windsTabBtn = document.getElementById("windsTabBtn");
  const repliesTabBtn = document.getElementById("repliesTabBtn");

  const goHomeBtn = document.getElementById("goHomeBtn");
  const goExploreBtn = document.getElementById("goExploreBtn");
  const goFeedBtn = document.getElementById("goFeedBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const profileDarkModeBtn = document.getElementById("profileDarkModeBtn");

  const MAX_CHANGES = 3;
  const targetIdentity = String(new URLSearchParams(window.location.search).get("user") || "").trim();

  let currentUser = null;
  let userRef = null;
  let activeTab = "winds";
  let isViewingOtherProfile = false;
  let viewLabels = [];

  const profileState = {
    nickname: "",
    handle: "",
    description: "",
    favoriteFood: "",
    favoriteSport: "",
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

  function setDarkMode(enabled) {
    document.body.classList.toggle("light-mode", !enabled);
    localStorage.setItem("kite-dark-mode", enabled ? "on" : "off");
    if (profileDarkModeBtn) {
      profileDarkModeBtn.textContent = enabled ? "🌙 Dark Mode: On" : "☀️ Dark Mode: Off";
    }
  }

  function applyStoredTheme() {
    const storedMode = localStorage.getItem("kite-dark-mode");
    setDarkMode(storedMode == null ? true : storedMode === "on");
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

  function setEditAvailability() {
    if (isViewingOtherProfile) {
      editProfileBtn.classList.add("hidden");
      editPanel.classList.add("hidden");
    } else {
      editProfileBtn.classList.remove("hidden");
    }
  }

  function applyProfileToUI() {
    nicknameValue.textContent = profileState.nickname;
    handleValue.textContent = `@${profileState.handle || "user"}`;
    descriptionValue.textContent = profileState.description || "No description yet.";
    profileAvatar.src = profileState.profilePicture;
    const onboardingDone = Boolean(profileState.favoriteFood && profileState.favoriteSport);
    profileMetaValue.textContent = onboardingDone ? "Kite account · Profile setup complete" : "Kite account · Finish profile setup";

    if (onboardingDone) {
      profileInterests.classList.remove("hidden");
      profileInterests.innerHTML = "";

      const foodChip = document.createElement("span");
      foodChip.className = "profile-interest-chip";
      foodChip.textContent = `🍔 ${profileState.favoriteFood}`;

      const sportChip = document.createElement("span");
      sportChip.className = "profile-interest-chip";
      sportChip.textContent = `🏅 ${profileState.favoriteSport}`;

      profileInterests.appendChild(foodChip);
      profileInterests.appendChild(sportChip);
    } else {
      profileInterests.classList.add("hidden");
    }

    nicknameEditInput.value = profileState.nickname;
    handleEditInput.value = `@${profileState.handle}`;
    descriptionEditInput.value = profileState.description;
    favoriteFoodEditInput.value = profileState.favoriteFood;
    favoriteSportEditInput.value = profileState.favoriteSport;
    updateChangeLabels();
    setEditAvailability();
  }

  function labelsFromIdentity(identity) {
    const vals = [identity.nickname, identity.handle ? `@${identity.handle}` : "", identity.handle, identity.email]
      .map((v) => String(v || "").trim())
      .filter(Boolean);
    return [...new Set(vals)];
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
    const seen = new Set();
    const allDocs = [];

    for (const label of viewLabels) {
      const snap = await firebase.firestore()
        .collection("winds")
        .where("user", "==", label)
        .orderBy("time", "desc")
        .limit(120)
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
    const replies = [];

    for (const label of viewLabels) {
      try {
        const snap = await firebase.firestore()
          .collectionGroup("comments")
          .where("user", "==", label)
          .orderBy("time", "desc")
          .limit(120)
          .get();

        snap.forEach((doc) => {
          replies.push({ id: doc.id, path: doc.ref.path, ...doc.data() });
        });
      } catch (error) {
        // Graceful fallback when indexes/rules are unavailable.
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

  async function findUserByIdentity(identity) {
    const db = firebase.firestore();
    const plain = identity.replace(/^@+/, "");

    const tries = [
      () => db.collection("users").where("nickname", "==", identity).limit(1).get(),
      () => db.collection("users").where("email", "==", identity).limit(1).get(),
      () => db.collection("users").where("handle", "==", plain.toLowerCase()).limit(1).get()
    ];

    for (const getSnap of tries) {
      const snap = await getSnap();
      if (!snap.empty) {
        const doc = snap.docs[0];
        return { id: doc.id, ...doc.data() };
      }
    }

    return null;
  }

  async function saveProfileChanges() {
    if (isViewingOtherProfile) {
      setMessage("You can only edit your own profile.");
      return;
    }

    hideMessage();

    const newNickname = nicknameEditInput.value.trim();
    const newHandle = normalizeHandle(handleEditInput.value);
    const newDescription = descriptionEditInput.value.trim();
    const newFavoriteFood = favoriteFoodEditInput.value.trim();
    const newFavoriteSport = favoriteSportEditInput.value.trim();

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

    if (newFavoriteFood !== profileState.favoriteFood) {
      updates.favoriteFood = newFavoriteFood;
    }

    if (newFavoriteSport !== profileState.favoriteSport) {
      updates.favoriteSport = newFavoriteSport;
    }

    if ("favoriteFood" in updates || "favoriteSport" in updates) {
      const finalFood = "favoriteFood" in updates ? updates.favoriteFood : profileState.favoriteFood;
      const finalSport = "favoriteSport" in updates ? updates.favoriteSport : profileState.favoriteSport;
      updates.onboardingComplete = Boolean(finalFood && finalSport);
    }

    if (!Object.keys(updates).length) {
      setMessage("No changes to save.");
      return;
    }

    await userRef.set(updates, { merge: true });

    Object.assign(profileState, {
      nickname: updates.nickname ?? profileState.nickname,
      handle: updates.handle ?? profileState.handle,
      description: updates.description ?? profileState.description,
      favoriteFood: updates.favoriteFood ?? profileState.favoriteFood,
      favoriteSport: updates.favoriteSport ?? profileState.favoriteSport,
      nicknameChanges: updates.nicknameChanges ?? profileState.nicknameChanges,
      handleChanges: updates.handleChanges ?? profileState.handleChanges,
      descriptionChanges: updates.descriptionChanges ?? profileState.descriptionChanges,
      profilePicture: updates.profilePicture ?? profileState.profilePicture
    });

    viewLabels = labelsFromIdentity(profileState);
    applyProfileToUI();
    editPanel.classList.add("hidden");
    setMessage("Profile saved.");
    renderProfileFeed();
  }

  applyStoredTheme();
  reportLoadStatus("Profile theme");

  firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    currentUser = user;
    userRef = firebase.firestore().collection("users").doc(user.uid);

    const ownSnap = await userRef.get();
    const ownData = ownSnap.exists ? ownSnap.data() : {};

    const ownNickname = ownData.nickname || user.displayName || "Anonymous";
    const ownHandle = ownData.handle || normalizeHandle(ownNickname + (user.uid || "").slice(0, 5)) || "user";
    const ownPicture = ownData.profilePicture || `images/pfp/${letterForAvatar(ownNickname)}.png`;

    const ownProfile = {
      nickname: ownNickname,
      handle: ownHandle,
      description: ownData.description || "",
      favoriteFood: ownData.favoriteFood || "",
      favoriteSport: ownData.favoriteSport || "",
      nicknameChanges: Number(ownData.nicknameChanges) || 0,
      handleChanges: Number(ownData.handleChanges) || 0,
      descriptionChanges: Number(ownData.descriptionChanges) || 0,
      profilePicture: ownPicture,
      email: ownData.email || user.email || ""
    };

    let chosen = ownProfile;
    if (targetIdentity && !labelsFromIdentity(ownProfile).map((v) => v.toLowerCase()).includes(targetIdentity.toLowerCase())) {
      const found = await findUserByIdentity(targetIdentity);
      if (found) {
        isViewingOtherProfile = true;
        chosen = {
          nickname: found.nickname || targetIdentity,
          handle: found.handle || normalizeHandle(found.nickname || targetIdentity) || "user",
          description: found.description || "",
          favoriteFood: found.favoriteFood || "",
          favoriteSport: found.favoriteSport || "",
          nicknameChanges: Number(found.nicknameChanges) || 0,
          handleChanges: Number(found.handleChanges) || 0,
          descriptionChanges: Number(found.descriptionChanges) || 0,
          profilePicture: found.profilePicture || `images/pfp/${letterForAvatar(found.nickname || targetIdentity)}.png`,
          email: found.email || ""
        };
      } else {
        isViewingOtherProfile = true;
        chosen = {
          nickname: targetIdentity,
          handle: normalizeHandle(targetIdentity) || "user",
          description: "",
          favoriteFood: "",
          favoriteSport: "",
          nicknameChanges: 0,
          handleChanges: 0,
          descriptionChanges: 0,
          profilePicture: `images/pfp/${letterForAvatar(targetIdentity)}.png`,
          email: ""
        };
      }
    }

    Object.assign(profileState, chosen);
    viewLabels = labelsFromIdentity({ ...chosen, email: chosen.email });

    if (!ownSnap.exists || !ownData.handle) {
      await userRef.set({
        nickname: ownProfile.nickname,
        handle: ownProfile.handle,
        profilePicture: ownProfile.profilePicture,
        favoriteFood: ownProfile.favoriteFood,
        favoriteSport: ownProfile.favoriteSport,
        nicknameChanges: ownProfile.nicknameChanges,
        handleChanges: ownProfile.handleChanges,
        descriptionChanges: ownProfile.descriptionChanges
      }, { merge: true });
    }

    applyProfileToUI();
    setActiveTab("winds");
    reportLoadStatus("Profile data");

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
      if (isViewingOtherProfile) return;
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
        reportLoadStatus("Profile save");
      } catch (error) {
        reportLoadStatus("Profile save", error);
        setMessage(`Could not save profile: ${error.message || "unknown error"}`);
      }
    });

    windsTabBtn.addEventListener("click", () => setActiveTab("winds"));
    repliesTabBtn.addEventListener("click", () => setActiveTab("replies"));

    if (profileDarkModeBtn) {
      profileDarkModeBtn.addEventListener("click", () => {
        const enabled = !document.body.classList.contains("light-mode");
        setDarkMode(!enabled);
      });
    }

    logoutBtn.addEventListener("click", async () => {
      await firebase.auth().signOut();
      window.location.href = "login.html";
    });

    reportLoadStatus("Profile page");
  });
})();
