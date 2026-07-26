import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, setAuthToken } from "./api/client";
import {
  fetchAudience,
  createAudienceMember,
  deleteAudienceMember,
  fetchSegment,
  fetchSegmentCount,
} from "./api/audience";

function AudienceManager() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("");
  const [filterGeography, setFilterGeography] = useState("");
  const queryClient = useQueryClient();

  const hasFilters = filterLanguage || filterGeography;

  const { data: members, isLoading } = useQuery({
    queryKey: ["audience", filterLanguage, filterGeography],
    queryFn: () =>
      hasFilters
        ? fetchSegment({
            language: filterLanguage || undefined,
            geography: filterGeography || undefined,
          })
        : fetchAudience(),
    enabled: loggedIn,
  });

  const { data: segmentCount } = useQuery({
    queryKey: ["audience-count", filterLanguage, filterGeography],
    queryFn: () =>
      fetchSegmentCount({
        language: filterLanguage || undefined,
        geography: filterGeography || undefined,
      }),
    enabled: loggedIn && !!hasFilters,
  });

  const createMutation = useMutation({
    mutationFn: createAudienceMember,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["audience"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAudienceMember,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["audience"] }),
  });

  async function handleLogin(email: string, password: string) {
    const form = new URLSearchParams();
    form.append("username", email);
    form.append("password", password);
    const res = await apiClient.post("/auth/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    setAuthToken(res.data.access_token);
    setLoggedIn(true);
  }

  if (!loggedIn) {
    return (
      <div style={{ padding: 20 }}>
        <button onClick={() => handleLogin("test7@example.com", "testpass123")}>
          Login as admin (test)
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Audience Manager</h1>

      <div style={{ marginBottom: 20, padding: 10, border: "1px solid #ccc" }}>
        <strong>Filter segment:</strong>{" "}
        <input
          placeholder="Language (e.g. hi)"
          value={filterLanguage}
          onChange={(e) => setFilterLanguage(e.target.value)}
        />
        <input
          placeholder="Geography (e.g. Bihar)"
          value={filterGeography}
          onChange={(e) => setFilterGeography(e.target.value)}
        />
        {hasFilters && segmentCount !== undefined && (
          <span> — {segmentCount} recipients match</span>
        )}
      </div>

      <div style={{ marginBottom: 20 }}>
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input
          placeholder="Language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        />
        <button
          onClick={() => {
            createMutation.mutate({ name, language });
            setName("");
            setLanguage("");
          }}
        >
          Add member
        </button>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <table border={1} cellPadding={8}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Language</th>
              <th>Geography</th>
              <th>Occupation</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {members?.map((m) => (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td>{m.language}</td>
                <td>{m.geography}</td>
                <td>{m.occupation}</td>
                <td>
                  <button onClick={() => deleteMutation.mutate(m.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AudienceManager;