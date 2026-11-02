
import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import GroupChat from "./GroupChat";
import Sessions from "./Sessions";
import Resources from "./Resources";

const API = "http://localhost:5000/api";

function Groups() {
  const studentID = Number(localStorage.getItem("studentID"));

  const [groups, setGroups] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [requests, setRequests] = useState([]);
  const [members, setMembers] = useState([]);

  const [groupName, setGroupName] = useState("");
  const [activeTab, setActiveTab] = useState("my");

  const [activeSection, setActiveSection] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);

  const [loading, setLoading] = useState(false);
  const [busyGroup, setBusyGroup] = useState(null);
  const [error, setError] = useState("");

  // Load groups the student has joined
  const loadMyGroups = useCallback(async () => {
    try {
      const res = await axios.get(
        `${API}/groups/student/${studentID}`
      );
      setGroups(res.data);
    } catch (err) {
      console.error("My groups:", err.response?.data || err.message);
    }
  }, [studentID]);

  // Load all groups
  const loadAllGroups = useCallback(async () => {
    try {
      const res = await axios.get(
        `${API}/groups?studentID=${studentID}`
      );
      setAllGroups(res.data);
    } catch (err) {
      console.error("All groups:", err.response?.data || err.message);
      setError("Could not load groups. Check the backend server.");
    }
  }, [studentID]);

  // Load invitations
  const loadInvitations = useCallback(async () => {
    try {
      const res = await axios.get(
        `${API}/groups/invitations/${studentID}`
      );
      setInvitations(res.data);
    } catch (err) {
      console.error("Invitations:", err.response?.data || err.message);
    }
  }, [studentID]);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    try {
      const res = await axios.get(
        `${API}/notifications/${studentID}`
      );
      setNotifications(res.data);
    } catch (err) {
      console.error("Notifications:", err.response?.data || err.message);
    }
  }, [studentID]);

  useEffect(() => {
    if (!studentID || !Number.isInteger(studentID)) {
      setError("Student ID not found. Please log in again.");
      return;
    }

    loadMyGroups();
    loadAllGroups();
    loadInvitations();
    loadNotifications();
  }, [
    studentID,
    loadMyGroups,
    loadAllGroups,
    loadInvitations,
    loadNotifications
  ]);

  // Create a group
  const createGroup = async (e) => {
    e.preventDefault();

    if (!groupName.trim()) {
      alert("Please enter a group name.");
      return;
    }

    try {
      setLoading(true);

      await axios.post(`${API}/groups`, {
        groupName: groupName.trim(),
        createdBy: studentID
      });

      setGroupName("");
      await loadMyGroups();
      await loadAllGroups();
      setActiveTab("my");
      setActiveSection(null);

      alert("Group created successfully!");
    } catch (err) {
      console.error("Create group:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Could not create group.");
    } finally {
      setLoading(false);
    }
  };

  // Request to join a group
  const requestToJoin = async (groupID) => {
    if (busyGroup !== null) return;

    try {
      setBusyGroup(groupID);
      setError("");

      await axios.post(`${API}/groups/${groupID}/request`, {
        studentID
      });

      setAllGroups((previousGroups) =>
        previousGroups.map((group) =>
          Number(group.GroupID) === Number(groupID)
            ? { ...group, RequestStatus: "Pending" }
            : group
        )
      );

      await loadAllGroups();
      alert("Join request sent successfully!");
    } catch (err) {
      console.error("Join request:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Could not send join request.");
      await loadAllGroups();
    } finally {
      setBusyGroup(null);
    }
  };

  // Open join requests
  const openRequests = async (group) => {
    setSelectedGroup(group);
    setActiveSection("requests");
    setRequests([]);

    try {
      const res = await axios.get(
        `${API}/groups/${group.GroupID}/requests?studentID=${studentID}`
      );
      setRequests(res.data);
    } catch (err) {
      console.error("Join requests:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Could not load join requests.");
    }
  };

  // Accept or reject a join request
  const handleRequest = async (requestID, action) => {
    try {
      await axios.put(`${API}/groups/request/${requestID}`, {
        studentID,
        action
      });

      await loadMyGroups();
      await loadAllGroups();

      if (selectedGroup) {
        await openRequests(selectedGroup);
      }

      alert(action === "accept" ? "Request accepted!" : "Request rejected!");
    } catch (err) {
      console.error("Process request:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Could not process request.");
    }
  };

  // Open group members
  const openMembers = async (group) => {
    setSelectedGroup(group);
    setActiveSection("members");
    setMembers([]);

    try {
      const res = await axios.get(
        `${API}/groups/${group.GroupID}/members`
      );
      setMembers(res.data);
    } catch (err) {
      console.error("Group members:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Could not load members.");
    }
  };

  // Change member role
  const changeRole = async (groupID, memberID, role) => {
    try {
      // IMPORTANT: backend expects adminID, not studentID.
      await axios.put(`${API}/groups/${groupID}/role`, {
        adminID: studentID,
        memberID: Number(memberID),
        role
      });

      // Refresh the member list after the role update
      await openMembers({ GroupID: groupID });

      alert(
        role === "Co-admin"
          ? "Member promoted to Co-admin!"
          : "Member role changed to Member!"
      );
    } catch (err) {
      console.error(
        "Change role:",
        err.response?.data || err.message
      );

      alert(
        err.response?.data?.message ||
        "Could not update member role."
      );

      if (selectedGroup) {
        await openMembers(selectedGroup);
      }
    }
  };

  // Invite a student
  const inviteStudent = async (groupID) => {
    const value = prompt("Enter the Student ID to invite:");

    if (!value || !value.trim()) return;

    const invitedStudentID = Number(value);

    if (
      !Number.isInteger(invitedStudentID) ||
      invitedStudentID <= 0
    ) {
      alert("Please enter a valid Student ID.");
      return;
    }

    try {
      await axios.post(`${API}/groups/${groupID}/invite`, {
        senderID: studentID,
        studentID: invitedStudentID
      });

      alert("Invitation sent successfully!");
      await loadAllGroups();
    } catch (err) {
      console.error("Invite student:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Could not send invitation.");
    }
  };

  // Accept or decline an invitation
  const respondToInvitation = async (requestID, action) => {
    try {
      await axios.put(`${API}/groups/invitation/${requestID}`, {
        studentID,
        action
      });

      await loadInvitations();
      await loadMyGroups();
      await loadAllGroups();

      alert(
        action === "accept"
          ? "Invitation accepted!"
          : "Invitation declined!"
      );
    } catch (err) {
      console.error("Invitation:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Could not process invitation.");
    }
  };

  // Mark notifications as read
  const markNotificationsRead = async () => {
    try {
      await axios.put(`${API}/notifications/${studentID}/read`);
      await loadNotifications();
    } catch (err) {
      console.error("Notifications:", err.response?.data || err.message);
      alert("Could not mark notifications as read.");
    }
  };

  // Close the currently open section
  const closeSection = () => {
    setActiveSection(null);
    setSelectedChat(null);
    setSelectedGroup(null);
    setRequests([]);
    setMembers([]);
  };

  if (!studentID || !Number.isInteger(studentID)) {
    return (
      <div className="page-container">
        <h2>Please log in again to view study groups.</h2>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1>Study Groups</h1>

      {error && <p className="error-message">{error}</p>}

      {/* CREATE GROUP */}
      <form className="card" onSubmit={createGroup}>
        <h2>Create a Study Group</h2>

        <input
          type="text"
          placeholder="Enter group name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          maxLength={100}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Group"}
        </button>
      </form>

      {/* TABS */}
      <div className="group-tabs">
        <button
          type="button"
          className={activeTab === "my" ? "active" : ""}
          onClick={() => {
            setActiveTab("my");
            closeSection();
          }}
        >
          My Groups ({groups.length})
        </button>

        <button
          type="button"
          className={activeTab === "browse" ? "active" : ""}
          onClick={() => {
            setActiveTab("browse");
            closeSection();
          }}
        >
          Browse Groups
        </button>

        <button
          type="button"
          className={activeTab === "invitations" ? "active" : ""}
          onClick={() => {
            setActiveTab("invitations");
            closeSection();
          }}
        >
          Invitations ({invitations.length})
        </button>

        <button
          type="button"
          className={activeTab === "notifications" ? "active" : ""}
          onClick={() => {
            setActiveTab("notifications");
            closeSection();
          }}
        >
          Notifications (
          {notifications.filter((n) => n.Status === "Unread").length})
        </button>
      </div>

      {/* MY GROUPS */}
      {activeTab === "my" && (
        <section>
          <h2>My Groups</h2>

          {groups.length === 0 ? (
            <p>You have not joined any groups yet.</p>
          ) : (
            <div className="group-list">
              {groups.map((group) => (
                <div className="card" key={group.GroupID}>
                  <h3>{group.GroupName}</h3>
                  <p>Group ID: {group.GroupID}</p>

                  <div className="group-actions">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSection("chat");
                        setSelectedGroup(group);
                        setSelectedChat({
                          chatID: group.ChatID,
                          groupName: group.GroupName
                        });
                      }}
                    >
                      Open Chat
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveSection("sessions");
                        setSelectedGroup(group);
                        setSelectedChat(null);
                      }}
                    >
                      Sessions
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveSection("resources");
                        setSelectedGroup(group);
                        setSelectedChat(null);
                      }}
                    >
                      Resources
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedChat(null);
                        openMembers(group);
                      }}
                    >
                      Members
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedChat(null);
                        openRequests(group);
                      }}
                    >
                      Join Requests
                    </button>

                    <button
                      type="button"
                      onClick={() => inviteStudent(group.GroupID)}
                    >
                      Invite Student
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* BROWSE GROUPS */}
      {activeTab === "browse" && (
        <section>
          <h2>Browse Groups</h2>

          {allGroups.length === 0 ? (
            <p>No groups available.</p>
          ) : (
            <div className="group-list">
              {allGroups.map((group) => (
                <div className="card" key={group.GroupID}>
                  <h3>{group.GroupName}</h3>
                  <p>Group ID: {group.GroupID}</p>

                  {Number(group.IsMember) === 1 ? (
                    <button type="button" disabled>
                      Already a Member
                    </button>
                  ) : group.RequestStatus === "Pending" ? (
                    <button type="button" disabled>
                      Requested
                    </button>
                  ) : group.RequestStatus === "Invited" ? (
                    <button
                      type="button"
                      onClick={() => setActiveTab("invitations")}
                    >
                      View Invitation
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={
                        Number(busyGroup) === Number(group.GroupID)
                      }
                      onClick={() => requestToJoin(group.GroupID)}
                    >
                      {Number(busyGroup) === Number(group.GroupID)
                        ? "Sending..."
                        : "Request to Join"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* INVITATIONS */}
      {activeTab === "invitations" && (
        <section>
          <h2>Invitations</h2>

          {invitations.length === 0 ? (
            <p>You have no invitations.</p>
          ) : (
            <div className="group-list">
              {invitations.map((item) => (
                <div className="card" key={item.RequestID}>
                  <h3>{item.GroupName || `Group ${item.GroupID}`}</h3>
                  <p>Group ID: {item.GroupID}</p>

                  <button
                    type="button"
                    onClick={() =>
                      respondToInvitation(item.RequestID, "accept")
                    }
                  >
                    Accept
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      respondToInvitation(item.RequestID, "decline")
                    }
                  >
                    Decline
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* NOTIFICATIONS */}
      {activeTab === "notifications" && (
        <section>
          <h2>Notifications</h2>

          <button type="button" onClick={markNotificationsRead}>
            Mark All as Read
          </button>

          {notifications.length === 0 ? (
            <p>You have no notifications.</p>
          ) : (
            <div className="group-list">
              {notifications.map((item) => (
                <div className="card" key={item.NotificationID}>
                  <p>{item.Message}</p>
                  <p>Status: {item.Status}</p>
                  {item.NotificationDate && (
                    <small>{item.NotificationDate}</small>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* GROUP CHAT */}
      {activeTab === "my" &&
        activeSection === "chat" &&
        selectedChat && (
          <section className="card">
            <button type="button" onClick={closeSection}>
              Close Chat
            </button>

            <GroupChat
              chatID={selectedChat.chatID}
              groupName={selectedChat.groupName}
            />
          </section>
        )}

      {/* SESSIONS */}
      {activeTab === "my" &&
        activeSection === "sessions" &&
        selectedGroup && (
          <section className="card">
            <button type="button" onClick={closeSection}>
              Close Sessions
            </button>

            <Sessions group={selectedGroup} />
          </section>
        )}

      {/* RESOURCES */}
      {activeTab === "my" &&
        activeSection === "resources" &&
        selectedGroup && (
          <section className="card">
            <button type="button" onClick={closeSection}>
              Close Resources
            </button>

            <Resources group={selectedGroup} />
          </section>
        )}

      {/* MEMBERS */}
      {activeTab === "my" &&
        activeSection === "members" &&
        selectedGroup && (
          <section className="card">
            <button type="button" onClick={closeSection}>
              Close Members
            </button>

            <h2>Members - {selectedGroup.GroupName}</h2>

            {members.length === 0 ? (
              <p>No members found.</p>
            ) : (
              members.map((member) => (
                <div className="member-row" key={member.StudentID}>
                  <p>
                    {member.Name || `Student ${member.StudentID}`} —{" "}
                    {member.Role}
                  </p>

                  {Number(selectedGroup.CreatedBy) === studentID &&
                    Number(member.StudentID) !== studentID &&
                    member.Role !== "Admin" && (
                      <select
                        value={member.Role}
                        onChange={(e) =>
                          changeRole(
                            selectedGroup.GroupID,
                            member.StudentID,
                            e.target.value
                          )
                        }
                      >
                        <option value="Member">Member</option>
                        <option value="Co-admin">Co-admin</option>
                      </select>
                    )}
                </div>
              ))
            )}
          </section>
        )}

      {/* JOIN REQUESTS */}
      {activeTab === "my" &&
        activeSection === "requests" &&
        selectedGroup && (
          <section className="card">
            <button type="button" onClick={closeSection}>
              Close Join Requests
            </button>

            <h2>Join Requests - {selectedGroup.GroupName}</h2>

            {requests.length === 0 ? (
              <p>No pending join requests.</p>
            ) : (
              requests.map((item) => (
                <div className="member-row" key={item.RequestID}>
                  <p>
                    {item.Name || `Student ${item.StudentID}`} — Student ID:{" "}
                    {item.StudentID}
                  </p>

                  <button
                    type="button"
                    onClick={() => handleRequest(item.RequestID, "accept")}
                  >
                    Accept
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRequest(item.RequestID, "reject")}
                  >
                    Reject
                  </button>
                </div>
              ))
            )}
          </section>
        )}
    </div>
  );
}

export default Groups;
