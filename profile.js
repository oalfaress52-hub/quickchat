(function initProfilePage() {
  const profilePageMarkup = `
    <main class="feed-page profile-page-shell">
      <aside class="feed-sidebar profile-sidebar" id="profileSidebar">
        <div class="sidebar-top-row">
          <div class="sidebar-brand" aria-label="Kite brand">🐦 <strong>Kite</strong></div>
        </div>

        <nav class="feed-nav profile-nav" aria-label="Main navigation">
          <button id="goHomeBtn" class="sidebar-btn" type="button">🏠 <span>Home</span></button>
          <button id="goExploreBtn" class="sidebar-btn" type="button">🌎 <span>Explore</span></button>
          <button class="sidebar-btn active" type="button">👤 <span data-i18n="feed.profile">Profile</span></button>
          <button id="goSettingsBtn" class="sidebar-btn" type="button">⚙️ <span data-i18n="feed.settings">Settings</span></button>
        </nav>

        <button id="profileDarkModeBtn" class="secondary-btn" type="button">🌙 Dark Mode: On</button>

        <div class="profile-sidebar-actions">
          <button id="goFeedBtn" class="primary-btn" type="button">Open Wind Feed</button>
          <button id="logoutBtn" class="secondary-btn danger" type="button" data-i18n="feed.logout">Logout</button>
        </div>
      </aside>

      <section class="feed-main profile-main">
        <div class="feed-main-inner">
          <header class="profile-banner"></header>

          <section class="profile-identity-card">
            <img
              id="profileAvatar"
              class="profile-avatar-large"
              alt="Profile picture"
              src="${window.avatarProfilePictureForName ? window.avatarProfilePictureForName("a") : ""}"
            />

            <div class="profile-headline">
              <h1><span id="nicknameValue">-</span> <span id="smartTagValue" class="smart-tag hidden">#new</span></h1>
              <p id="handleValue" class="profile-handle">@-</p>
              <p id="descriptionValue" class="profile-description">-</p>
              <p id="profileMetaValue" class="profile-meta">Kite account</p>
              <div id="profileInterests" class="profile-interests hidden"></div>
            </div>

            <button id="editProfileBtn" class="secondary-btn" type="button">Edit profile</button>
          </section>

          <section id="editPanel" class="profile-edit-panel hidden">
            <h3>Edit profile</h3>
            <div class="profile-edit-row">
              <label>Nickname</label>
              <input id="nicknameEditInput" type="text" maxlength="15" placeholder="Nickname" />
              <small id="nicknameChangesLeft">Nickname changes left: 3</small>
            </div>
            <div class="profile-edit-row">
              <label>@ handle</label>
              <input id="handleEditInput" type="text" maxlength="24" placeholder="@yourhandle" />
              <small id="handleChangesLeft">@ changes left: 3</small>
            </div>
            <div class="profile-edit-row">
              <label>Description</label>
              <textarea id="descriptionEditInput" maxlength="220" placeholder="About you..."></textarea>
              <small id="descriptionChangesLeft">Description changes left: 3</small>
            </div>
            <div class="profile-edit-row">
              <label>Favorite food</label>
              <input id="favoriteFoodEditInput" type="text" maxlength="40" placeholder="Your favorite food" />
            </div>
            <div class="profile-edit-row">
              <label>Favorite sport</label>
              <input id="favoriteSportEditInput" type="text" maxlength="40" placeholder="Your favorite sport" />
            </div>
            <div class="profile-edit-row">
              <label>Current city</label>
              <input id="cityEditInput" type="text" maxlength="60" placeholder="Where you live" />
            </div>
            <div class="profile-edit-row">
              <label>Workplace</label>
              <input id="workEditInput" type="text" maxlength="80" placeholder="Company, role, or project" />
            </div>
            <div class="profile-edit-row">
              <label>Education</label>
              <input id="educationEditInput" type="text" maxlength="80" placeholder="School or training" />
            </div>
            <div class="profile-edit-row">
              <label>Website</label>
              <input id="websiteEditInput" type="url" maxlength="120" placeholder="https://example.com" />
            </div>
            <div class="profile-edit-row">
              <label>Relationship status</label>
              <select id="relationshipEditInput">
                <option value="">Prefer not to say</option>
                <option value="Single">Single</option>
                <option value="In a relationship">In a relationship</option>
                <option value="Married">Married</option>
                <option value="It's complicated">It's complicated</option>
              </select>
            </div>
            <div class="profile-edit-row">
              <label>Smart profile tag</label>
              <div class="smart-tag-row">
                <button id="generateTagBtn" class="secondary-btn" type="button">Generate smart tag</button>
                <small>Uses a tiny on-device neural score to summarize your profile.</small>
              </div>
            </div>
            <div class="profile-edit-actions">
              <button id="saveProfileBtn" class="primary-btn" type="button">Save profile</button>
              <button id="cancelEditBtn" class="secondary-btn" type="button">Cancel</button>
            </div>
          </section>

          <section class="profile-details-grid">
            <article class="profile-detail-card">
              <h3>Intro</h3>
              <ul id="profileIntroList" class="profile-detail-list"></ul>
            </article>
            <article class="profile-detail-card">
              <h3>Highlights</h3>
              <div id="profileStats" class="profile-stats"></div>
            </article>
          </section>

          <section class="profile-tabs">
            <button id="windsTabBtn" class="profile-tab active" type="button">Winds</button>
            <button id="repliesTabBtn" class="profile-tab" type="button">Replies</button>
          </section>

          <section id="profileFeed" class="profile-feed"></section>
          <p id="profileMsg" class="switch hidden"></p>
        </div>
      </section>

      <aside class="right-toolbar" aria-label="Search and tools">
        <h3>Search</h3>
        <input class="right-search" type="text" placeholder="Search @user/email or #hashtag" disabled />
        <p class="right-toolbar-note">Profile view keeps the same toolbar layout as feed.</p>
        <button type="button" class="secondary-btn" disabled>Clear Search</button>
      </aside>
    </main>
  `;

  function renderProfileShell() {
    document.body.classList.add("profile-view");
    const root = document.getElementById("profilePageRoot") || document.body;
    root.innerHTML = profilePageMarkup;
  }

  renderProfileShell();
  const reportLoadStatus = window.reportLoadStatus || ((name, error) => {
    if (error) {
      console.error(`error "${name}" didnt load ❌`, error);
    } else {
      console.info(`"${name}" succesfully loaded ✔`);
    }
  });

  const nicknameValue = document.getElementById("nicknameValue");
  const smartTagValue = document.getElementById("smartTagValue");
  const handleValue = document.getElementById("handleValue");
  const descriptionValue = document.getElementById("descriptionValue");
  const profileMetaValue = document.getElementById("profileMetaValue");
  const profileInterests = document.getElementById("profileInterests");
  const profileAvatar = document.getElementById("profileAvatar");
  const profileFeed = document.getElementById("profileFeed");
  const profileMsg = document.getElementById("profileMsg");
  const profileIntroList = document.getElementById("profileIntroList");
  const profileStats = document.getElementById("profileStats");

  const editProfileBtn = document.getElementById("editProfileBtn");
  const editPanel = document.getElementById("editPanel");
  const saveProfileBtn = document.getElementById("saveProfileBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
  const generateTagBtn = document.getElementById("generateTagBtn");

  const nicknameEditInput = document.getElementById("nicknameEditInput");
  const handleEditInput = document.getElementById("handleEditInput");
  const descriptionEditInput = document.getElementById("descriptionEditInput");
  const favoriteFoodEditInput = document.getElementById("favoriteFoodEditInput");
  const favoriteSportEditInput = document.getElementById("favoriteSportEditInput");
  const cityEditInput = document.getElementById("cityEditInput");
  const workEditInput = document.getElementById("workEditInput");
  const educationEditInput = document.getElementById("educationEditInput");
  const websiteEditInput = document.getElementById("websiteEditInput");
  const relationshipEditInput = document.getElementById("relationshipEditInput");

  const nicknameChangesLeft = document.getElementById("nicknameChangesLeft");
  const handleChangesLeft = document.getElementById("handleChangesLeft");
  const descriptionChangesLeft = document.getElementById("descriptionChangesLeft");

  const windsTabBtn = document.getElementById("windsTabBtn");
  const repliesTabBtn = document.getElementById("repliesTabBtn");

  const goHomeBtn = document.getElementById("goHomeBtn");
  const goExploreBtn = document.getElementById("goExploreBtn");
  const goFeedBtn = document.getElementById("goFeedBtn");
  const goSettingsBtn = document.getElementById("goSettingsBtn");
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
    city: "",
    workplace: "",
    education: "",
    website: "",
    relationshipStatus: "",
    smartTag: "",
    nicknameChanges: 0,
    handleChanges: 0,
    descriptionChanges: 0,
    profilePicture: ""
  };

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

  function renderProfileDetails() {
    const introItems = [];
    if (profileState.city) introItems.push(`📍 Lives in ${profileState.city}`);
    if (profileState.workplace) introItems.push(`💼 Works at ${profileState.workplace}`);
    if (profileState.education) introItems.push(`🎓 Studied at ${profileState.education}`);
    if (profileState.relationshipStatus) introItems.push(`❤️ ${profileState.relationshipStatus}`);
    if (profileState.website) introItems.push(`🔗 ${profileState.website}`);

    profileIntroList.innerHTML = "";
    if (!introItems.length) {
      const li = document.createElement("li");
      li.textContent = "No intro details yet.";
      profileIntroList.appendChild(li);
    } else {
      introItems.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        profileIntroList.appendChild(li);
      });
    }

    const score = [profileState.description, profileState.city, profileState.workplace, profileState.education, profileState.favoriteFood, profileState.favoriteSport]
      .filter(Boolean)
      .join(" ").length;
    const profilePower = Math.min(100, Math.round(score / 5));

    profileStats.innerHTML = `
      <div class="profile-stat"><strong>${profilePower}%</strong><span>Profile strength</span></div>
      <div class="profile-stat"><strong>${profileState.smartTag ? 1 : 0}</strong><span>Smart tags</span></div>
      <div class="profile-stat"><strong>${profileState.description.length}</strong><span>Bio chars</span></div>
    `;
  }

  function applyProfileToUI() {
    nicknameValue.textContent = profileState.nickname;
    handleValue.textContent = `@${profileState.handle || "user"}`;
    descriptionValue.textContent = profileState.description || "No description yet.";
    profileAvatar.src = window.resolveProfilePicture
      ? window.resolveProfilePicture(profileState.profilePicture, profileState.nickname || profileState.handle)
      : profileState.profilePicture;

    if (profileState.smartTag) {
      smartTagValue.textContent = `#${profileState.smartTag}`;
      smartTagValue.classList.remove("hidden");
    } else {
      smartTagValue.classList.add("hidden");
    }

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
    cityEditInput.value = profileState.city;
    workEditInput.value = profileState.workplace;
    educationEditInput.value = profileState.education;
    websiteEditInput.value = profileState.website;
    relationshipEditInput.value = profileState.relationshipStatus;

    updateChangeLabels();
    setEditAvailability();
    renderProfileDetails();
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

  function relu(v) {
    return Math.max(0, v);
  }

  function tinyNeuralTagger(snapshot) {
    const text = [snapshot.description, snapshot.favoriteFood, snapshot.favoriteSport, snapshot.workplace, snapshot.education].join(" ").toLowerCase();
    const feature = (k) => (text.includes(k) ? 1 : 0);
    const x = [
      Math.min(1, (snapshot.description || "").length / 180),
      feature("build") || feature("engineer") || feature("code"),
      feature("design") || feature("art") || feature("create"),
      feature("sport") || feature("run") || feature("fitness") || feature("soccer"),
      feature("food") || feature("chef") || feature("cook"),
      feature("music") || feature("movie") || feature("travel")
    ];

    const hidden = [
      relu(0.8 * x[0] + 1.1 * x[1] + 0.2 * x[5] - 0.3),
      relu(0.7 * x[0] + 1.2 * x[2] + 0.4 * x[5] - 0.4),
      relu(0.5 * x[0] + 1.4 * x[3] + 0.3 * x[4] - 0.3),
      relu(0.6 * x[0] + 0.9 * x[4] + 0.8 * x[5] - 0.2)
    ];

    const outputs = [
      { name: "builder", score: 1.2 * hidden[0] + 0.3 * hidden[1] },
      { name: "creator", score: 0.5 * hidden[0] + 1.2 * hidden[1] },
      { name: "athlete", score: 0.4 * hidden[2] + 0.4 * hidden[0] },
      { name: "lifestyle", score: 0.9 * hidden[3] + 0.4 * hidden[2] }
    ];

    outputs.sort((a, b) => b.score - a.score);
    const best = outputs[0]?.name || "member";
    const summary = `A ${best}-minded person into ${snapshot.favoriteSport || "new experiences"} and ${snapshot.favoriteFood || "good food"}.`;
    return {
      tag: best,
      summary
    };
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
    const newCity = cityEditInput.value.trim();
    const newWorkplace = workEditInput.value.trim();
    const newEducation = educationEditInput.value.trim();
    const newWebsite = websiteEditInput.value.trim();
    const newRelationshipStatus = relationshipEditInput.value;

    if (!newNickname) {
      setMessage("Nickname cannot be empty.");
      return;
    }
    if (window.containsBlacklistedWords && (window.containsBlacklistedWords(newNickname).flagged || window.containsBlacklistedWords(newDescription).flagged || window.containsBlacklistedWords(newFavoriteFood).flagged || window.containsBlacklistedWords(newFavoriteSport).flagged)) {
      const violation = await window.KITE_POLICY.registerPolicyViolation(currentUser, "blacklisted-profile", `${newNickname} ${newDescription}`);
      setMessage(violation.terminated ? "Policy violation detected. Account terminated." : "Profile contains blocked language.");
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
      updates.profilePicture = window.avatarProfilePictureForName
        ? window.avatarProfilePictureForName(newNickname)
        : profileState.profilePicture;
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

    if (newFavoriteFood !== profileState.favoriteFood) updates.favoriteFood = newFavoriteFood;
    if (newFavoriteSport !== profileState.favoriteSport) updates.favoriteSport = newFavoriteSport;
    if (newCity !== profileState.city) updates.city = newCity;
    if (newWorkplace !== profileState.workplace) updates.workplace = newWorkplace;
    if (newEducation !== profileState.education) updates.education = newEducation;
    if (newWebsite !== profileState.website) updates.website = newWebsite;
    if (newRelationshipStatus !== profileState.relationshipStatus) updates.relationshipStatus = newRelationshipStatus;

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
      city: updates.city ?? profileState.city,
      workplace: updates.workplace ?? profileState.workplace,
      education: updates.education ?? profileState.education,
      website: updates.website ?? profileState.website,
      relationshipStatus: updates.relationshipStatus ?? profileState.relationshipStatus,
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
    const policyResult = await window.KITE_POLICY.enforcePolicyForUser(user);
    if (!policyResult.allowed) {
      setMessage(policyResult.message || "Policy check failed.");
      setTimeout(() => { window.location.href = "login.html"; }, 800);
      return;
    }
    window.KITE_POLICY.setSessionCookie(user.uid, 30);
    userRef = firebase.firestore().collection("users").doc(user.uid);

    const ownSnap = await userRef.get();
    const ownData = ownSnap.exists ? ownSnap.data() : {};

    const ownNickname = ownData.nickname || user.displayName || "Anonymous";
    const ownHandle = ownData.handle || normalizeHandle(ownNickname + (user.uid || "").slice(0, 5)) || "user";
    const ownPicture = window.resolveProfilePicture
      ? window.resolveProfilePicture(ownData.profilePicture, ownNickname)
      : (ownData.profilePicture || "");

    const ownProfile = {
      nickname: ownNickname,
      handle: ownHandle,
      description: ownData.description || "",
      favoriteFood: ownData.favoriteFood || "",
      favoriteSport: ownData.favoriteSport || "",
      city: ownData.city || "",
      workplace: ownData.workplace || "",
      education: ownData.education || "",
      website: ownData.website || "",
      relationshipStatus: ownData.relationshipStatus || "",
      smartTag: ownData.smartTag || "",
      nicknameChanges: Number(ownData.nicknameChanges) || 0,
      handleChanges: Number(ownData.handleChanges) || 0,
      descriptionChanges: Number(ownData.descriptionChanges) || 0,
      profilePicture: ownPicture,
      email: ownData.email || user.email || "",
      language: ownData.language || "en"
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
          city: found.city || "",
          workplace: found.workplace || "",
          education: found.education || "",
          website: found.website || "",
          relationshipStatus: found.relationshipStatus || "",
          smartTag: found.smartTag || "",
          nicknameChanges: Number(found.nicknameChanges) || 0,
          handleChanges: Number(found.handleChanges) || 0,
          descriptionChanges: Number(found.descriptionChanges) || 0,
          profilePicture: window.resolveProfilePicture
            ? window.resolveProfilePicture(found.profilePicture, found.nickname || targetIdentity)
            : (found.profilePicture || ""),
          email: found.email || "",
          language: found.language || "en"
        };
      } else {
        isViewingOtherProfile = true;
        chosen = {
          nickname: targetIdentity,
          handle: normalizeHandle(targetIdentity) || "user",
          description: "",
          favoriteFood: "",
          favoriteSport: "",
          city: "",
          workplace: "",
          education: "",
          website: "",
          relationshipStatus: "",
          smartTag: "",
          nicknameChanges: 0,
          handleChanges: 0,
          descriptionChanges: 0,
          profilePicture: window.avatarProfilePictureForName
            ? window.avatarProfilePictureForName(targetIdentity)
            : "",
          email: "",
          language: "en"
        };
      }
    }

    Object.assign(profileState, chosen);
    if (chosen.language) window.KITE_I18N.setLanguage(chosen.language);
    await window.KITE_I18N.applyLanguage(document);
    viewLabels = labelsFromIdentity({ ...chosen, email: chosen.email });

    if (!ownSnap.exists || !ownData.handle) {
      await userRef.set({
        nickname: ownProfile.nickname,
        handle: ownProfile.handle,
        profilePicture: ownProfile.profilePicture,
        favoriteFood: ownProfile.favoriteFood,
        favoriteSport: ownProfile.favoriteSport,
        city: ownProfile.city,
        workplace: ownProfile.workplace,
        education: ownProfile.education,
        website: ownProfile.website,
        relationshipStatus: ownProfile.relationshipStatus,
        smartTag: ownProfile.smartTag,
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

    if (goSettingsBtn) {
      goSettingsBtn.addEventListener("click", () => {
        window.location.href = "settings.html";
      });
    }

    editProfileBtn.addEventListener("click", () => {
      if (isViewingOtherProfile) return;
      editPanel.classList.toggle("hidden");
    });

    cancelEditBtn.addEventListener("click", () => {
      editPanel.classList.add("hidden");
      applyProfileToUI();
      hideMessage();
    });

    generateTagBtn.addEventListener("click", async () => {
      const generated = tinyNeuralTagger({
        description: descriptionEditInput.value.trim(),
        favoriteFood: favoriteFoodEditInput.value.trim(),
        favoriteSport: favoriteSportEditInput.value.trim(),
        workplace: workEditInput.value.trim(),
        education: educationEditInput.value.trim()
      });

      descriptionEditInput.value = generated.summary;
      await userRef.set({ smartTag: generated.tag, description: generated.summary }, { merge: true });
      profileState.smartTag = generated.tag;
      profileState.description = generated.summary;
      applyProfileToUI();
      setMessage(`Smart tag generated: #${generated.tag}`);
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
      window.KITE_POLICY.clearSessionCookie();
      await firebase.auth().signOut();
      window.location.href = "login.html";
    });

    reportLoadStatus("Profile page");
  });
})();
