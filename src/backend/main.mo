import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Char "mo:core/Char";
import Order "mo:core/Order";
import Array "mo:core/Array";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";



actor {
  // Type Definitions
  public type UserProfile = {
    displayName : Text;
    bio : Text;
    role : Text;
  };

  public type StudyPost = {
    id : Nat;
    author : Principal;
    authorName : Text;
    title : Text;
    content : Text;
    subjectTag : Text;
    likes : [Principal];
    timestamp : Int;
  };

  public type Doubt = {
    id : Nat;
    author : Principal;
    authorName : Text;
    title : Text;
    content : Text;
    subjectTag : Text;
    comments : [Comment];
    timestamp : Int;
  };

  public type Comment = {
    author : Principal;
    authorName : Text;
    content : Text;
    timestamp : Int;
  };

  public type Event = {
    id : Nat;
    title : Text;
    description : Text;
    eventDate : Int;
    createdBy : Principal;
    timestamp : Int;
  };

  public type Announcement = {
    id : Nat;
    title : Text;
    content : Text;
    createdBy : Principal;
    timestamp : Int;
  };

  public type ChatMessage = {
    id : Nat;
    author : Principal;
    authorName : Text;
    content : Text;
    timestamp : Int;
  };

  public type Stats = {
    studyPostCount : Nat;
    doubtCount : Nat;
    eventCount : Nat;
    announcementCount : Nat;
    userCount : Nat;
  };

  public type UserProfileEntry = {
    principal : Principal;
    profile : UserProfile;
  };

  // Data Stores
  let userProfiles = Map.empty<Principal, UserProfile>();
  let studyPosts = Map.empty<Nat, StudyPost>();
  let doubts = Map.empty<Nat, Doubt>();
  let events = Map.empty<Nat, Event>();
  let announcements = Map.empty<Nat, Announcement>();
  let chatMessages = Map.empty<Nat, ChatMessage>();

  var nextStudyPostId = 0;
  var nextDoubtId = 0;
  var nextEventId = 0;
  var nextAnnouncementId = 0;
  var nextChatMessageId = 0;

  let accessControlState = AccessControl.initState();

  include MixinAuthorization(accessControlState);

  // Helper Functions
  func getTimestamp() : Int {
    Time.now();
  };

  func toLowerCase(text : Text) : Text {
    let chars = text.chars().toArray();
    let lowerChars = chars.map(func(c) { if (c >= 'A' and c <= 'Z') { Char.fromNat32(c.toNat32() + 32) } else { c } });
    Text.fromArray(lowerChars);
  };

  func reverseOrder(post1 : StudyPost, post2 : StudyPost) : Order.Order {
    Int.compare(post2.timestamp, post1.timestamp);
  };

  func reverseDoubtOrder(doubt1 : Doubt, doubt2 : Doubt) : Order.Order {
    Int.compare(doubt2.timestamp, doubt1.timestamp);
  };

  func reverseAnnouncementOrder(announcement1 : Announcement, announcement2 : Announcement) : Order.Order {
    Int.compare(announcement2.timestamp, announcement1.timestamp);
  };

  func toIndex(n : Nat) : Int {
    n.toInt();
  };

  // Register User - First user becomes admin, others become students
  public shared ({ caller }) func registerUser() : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous users cannot register");
    };

    // Skip if already registered in access control
    switch (accessControlState.userRoles.get(caller)) {
      case (?_) { return };
      case (null) {};
    };
    // First registered user becomes admin
    let isFirstUser = not accessControlState.adminAssigned;
    let acRole : AccessControl.UserRole = if (isFirstUser) { #admin } else { #user };
    let roleText : Text = if (isFirstUser) { "admin" } else { "student" };
    accessControlState.userRoles.add(caller, acRole);
    if (isFirstUser) { accessControlState.adminAssigned := true };
    switch (userProfiles.get(caller)) {
      case (null) {
        userProfiles.add(caller, { displayName = ""; bio = ""; role = roleText });
      };
      case (?_) {};
    };
  };

  // Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public query ({ caller }) func getMyProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    // Only allow viewing own profile or admin can view any profile
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func updateProfile(displayName : Text, bio : Text) : async () {
    if (displayName.size() < 3 or displayName.size() > 30) {
      Runtime.trap("Display name must be between 3 and 30 characters");
    };
    if (bio.size() > 200) {
      Runtime.trap("Bio must be less than 200 characters");
    };

    // Auto-register if not registered
    let currentRole = AccessControl.getUserRole(accessControlState, caller);
    if (currentRole == #guest) {
      if (caller.isAnonymous()) {
        Runtime.trap("Anonymous users cannot update profile");
      };
      // Register the user
      let role : Text = if (userProfiles.size() == 0) { "admin" } else { "student" };
      let profile : UserProfile = {
        displayName;
        bio;
        role;
      };
      userProfiles.add(caller, profile);
    } else {
      // Update existing profile
      let existingProfile = switch (userProfiles.get(caller)) {
        case (?p) { p };
        case (null) {
          // Has access control role but no profile - create one
          let role = if (currentRole == #admin) { "admin" } else { "student" };
          { displayName = ""; bio = ""; role };
        };
      };
      let profile : UserProfile = {
        displayName;
        bio;
        role = existingProfile.role;
      };
      userProfiles.add(caller, profile);
    };
  };

  public query ({ caller }) func isAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  // NEW - Get all user profiles with non-empty displayName
  // Public query - no authorization needed per specification
  public query func getAllUserProfiles() : async [UserProfileEntry] {
    userProfiles.entries().toArray().filter(
      func((principal, profile)) {
        profile.displayName != "";
      }
    ).map(func((principal, profile)) { { principal; profile } });
  };

  // Study Post Functions
  public shared ({ caller }) func createStudyPost(title : Text, content : Text, subjectTag : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can create study posts");
    };
    if (title.size() < 5 or title.size() > 100) {
      Runtime.trap("Title must be between 5 and 100 characters");
    };
    if (content.size() < 10) {
      Runtime.trap("Content must be at least 10 characters");
    };
    let authorName = switch (userProfiles.get(caller)) {
      case (null) { "" };
      case (?profile) { profile.displayName };
    };
    let post : StudyPost = {
      id = nextStudyPostId;
      author = caller;
      authorName;
      title;
      content;
      subjectTag = toLowerCase(subjectTag);
      likes = [];
      timestamp = getTimestamp();
    };
    studyPosts.add(nextStudyPostId, post);
    nextStudyPostId += 1;
  };

  public query func getStudyPosts() : async [StudyPost] {
    studyPosts.values().toArray().sort(reverseOrder);
  };

  public shared ({ caller }) func likeStudyPost(id : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can like study posts");
    };
    switch (studyPosts.get(id)) {
      case (null) { Runtime.trap("Study post not found") };
      case (?post) {
        let hasLiked = post.likes.values().any(func(p) { p == caller });
        let newLikes = if (hasLiked) {
          List.fromArray(post.likes).filter(func(p) { p != caller }).toArray();
        } else {
          post.likes.concat([caller]);
        };
        let updatedPost : StudyPost = {
          id = post.id;
          author = post.author;
          authorName = post.authorName;
          title = post.title;
          content = post.content;
          subjectTag = post.subjectTag;
          likes = newLikes;
          timestamp = post.timestamp;
        };
        studyPosts.add(id, updatedPost);
      };
    };
  };

  public shared ({ caller }) func deleteStudyPost(id : Nat) : async () {
    let post = switch (studyPosts.get(id)) {
      case (null) { Runtime.trap("Study post not found") };
      case (?p) { p };
    };
    // Only author or admin can delete
    if (post.author != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only authors or admins can delete study posts");
    };
    studyPosts.remove(id);
  };

  // Doubt Functions
  public shared ({ caller }) func createDoubt(title : Text, content : Text, subjectTag : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can create doubts");
    };
    if (title.size() < 5 or title.size() > 100) {
      Runtime.trap("Title must be between 5 and 100 characters");
    };
    if (content.size() < 10) {
      Runtime.trap("Content must be at least 10 characters");
    };
    let authorName = switch (userProfiles.get(caller)) {
      case (null) { "" };
      case (?profile) { profile.displayName };
    };
    let doubt : Doubt = {
      id = nextDoubtId;
      author = caller;
      authorName;
      title;
      content;
      subjectTag = toLowerCase(subjectTag);
      comments = [];
      timestamp = getTimestamp();
    };
    doubts.add(nextDoubtId, doubt);
    nextDoubtId += 1;
  };

  public query func getDoubts() : async [Doubt] {
    doubts.values().toArray().sort(reverseDoubtOrder);
  };

  public shared ({ caller }) func addComment(doubtId : Nat, content : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add comments");
    };
    switch (doubts.get(doubtId)) {
      case (null) { Runtime.trap("Doubt not found") };
      case (?doubt) {
        if (content.size() < 1 or content.size() > 500) {
          Runtime.trap("Comment must be between 1 and 500 characters");
        };
        let authorName = switch (userProfiles.get(caller)) {
          case (null) { "" };
          case (?profile) { profile.displayName };
        };
        let comment : Comment = {
          author = caller;
          authorName;
          content;
          timestamp = getTimestamp();
        };
        let updatedComments = doubt.comments.concat([comment]);
        let updatedDoubt : Doubt = {
          id = doubt.id;
          author = doubt.author;
          authorName = doubt.authorName;
          title = doubt.title;
          content = doubt.content;
          subjectTag = doubt.subjectTag;
          comments = updatedComments;
          timestamp = doubt.timestamp;
        };
        doubts.add(doubtId, updatedDoubt);
      };
    };
  };

  public shared ({ caller }) func deleteDoubt(id : Nat) : async () {
    let doubt = switch (doubts.get(id)) {
      case (null) { Runtime.trap("Doubt not found") };
      case (?d) { d };
    };
    // Only author or admin can delete
    if (doubt.author != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only authors or admins can delete doubts");
    };
    doubts.remove(id);
  };

  public shared ({ caller }) func updateDoubt(id : Nat, title : Text, content : Text, subjectTag : Text) : async () {
    let doubt = switch (doubts.get(id)) {
      case (null) { Runtime.trap("Doubt not found") };
      case (?d) { d };
    };
    // Only author can update
    if (doubt.author != caller) {
      Runtime.trap("Unauthorized: Only authors can update doubts");
    };
    if (title.size() < 5 or title.size() > 100) {
      Runtime.trap("Title must be between 5 and 100 characters");
    };
    if (content.size() < 10) {
      Runtime.trap("Content must be at least 10 characters");
    };
    let updatedDoubt : Doubt = {
      id = doubt.id;
      author = doubt.author;
      authorName = doubt.authorName;
      title;
      content;
      subjectTag = toLowerCase(subjectTag);
      comments = doubt.comments;
      timestamp = doubt.timestamp;
    };
    doubts.add(id, updatedDoubt);
  };

  // Event Functions
  public shared ({ caller }) func createEvent(title : Text, description : Text, eventDate : Int) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can create events");
    };
    if (title.size() < 5 or title.size() > 100) {
      Runtime.trap("Title must be between 5 and 100 characters");
    };
    if (description.size() < 10) {
      Runtime.trap("Description must be at least 10 characters");
    };
    let event : Event = {
      id = nextEventId;
      title;
      description;
      eventDate;
      createdBy = caller;
      timestamp = getTimestamp();
    };
    events.add(nextEventId, event);
    nextEventId += 1;
  };

  public query func getEvents() : async [Event] {
    let eventsArray = events.values().toArray();
    eventsArray.sort(func(e1 : Event, e2 : Event) : Order.Order {
      Int.compare(e1.eventDate, e2.eventDate);
    });
  };

  // Announcement Functions
  public shared ({ caller }) func createAnnouncement(title : Text, content : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can create announcements");
    };
    if (title.size() < 5 or title.size() > 100) {
      Runtime.trap("Title must be between 5 and 100 characters");
    };
    if (content.size() < 10) {
      Runtime.trap("Content must be at least 10 characters");
    };
    let announcement : Announcement = {
      id = nextAnnouncementId;
      title;
      content;
      createdBy = caller;
      timestamp = getTimestamp();
    };
    announcements.add(nextAnnouncementId, announcement);
    nextAnnouncementId += 1;
  };

  public query func getAnnouncements() : async [Announcement] {
    announcements.values().toArray().sort(reverseAnnouncementOrder);
  };

  // Chat Functions
  public shared ({ caller }) func sendChatMessage(content : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can send chat messages");
    };
    if (content.size() < 1 or content.size() > 500) {
      Runtime.trap("Message must be between 1 and 500 characters");
    };
    let authorName = switch (userProfiles.get(caller)) {
      case (null) { "" };
      case (?profile) { profile.displayName };
    };
    let message : ChatMessage = {
      id = nextChatMessageId;
      author = caller;
      authorName;
      content;
      timestamp = getTimestamp();
    };
    chatMessages.add(nextChatMessageId, message);
    if (nextChatMessageId >= 100) {
      chatMessages.remove(nextChatMessageId - 100 : Nat);
    };
    nextChatMessageId += 1;
  };

  public query func getChatMessages() : async [ChatMessage] {
    let messagesArray = chatMessages.values().toArray().sort(func(m1 : ChatMessage, m2 : ChatMessage) : Order.Order {
      Int.compare(m1.timestamp, m2.timestamp);
    });
    let count = Nat.min(messagesArray.size(), 100);
    Array.tabulate<ChatMessage>(count, func(i) { messagesArray[i] });
  };

  // Stats Function
  public query func getStats() : async Stats {
    {
      studyPostCount = studyPosts.size();
      doubtCount = doubts.size();
      eventCount = events.size();
      announcementCount = announcements.size();
      userCount = userProfiles.size();
    };
  };
};
