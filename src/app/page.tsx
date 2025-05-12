"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [combinedContests, setCombinedContests] = useState({
    national: {},
    local: {},
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVotes = async () => {
      const res = await fetch("/api/getVotesFiles");
      const { files } = await res.json();

      const combinedContestsData = {
        national: {},
        local: {},
      };

      const addContests = (source, type) => {
        source[type].forEach((contest) => {
          const key = contest.contestCode;
          if (!combinedContestsData[type][key]) {
            combinedContestsData[type][key] = {
              contestName: contest.contestName,
              candidates: {},
            };
          }

          contest.candidates.candidates.forEach(({ name, votes }) => {
            if (combinedContestsData[type][key].candidates[name]) {
              combinedContestsData[type][key].candidates[name] += votes;
            } else {
              combinedContestsData[type][key].candidates[name] = votes;
            }
          });
        });
      };

      for (const file of files) {
        try {
          const res = await fetch(`/VOTES/${file}`);
          const contentType = res.headers.get("content-type");

          if (!res.ok) {
            console.error(`Failed to load ${file}: HTTP ${res.status}`);
            continue;
          }

          if (!contentType?.includes("application/json")) {
            const text = await res.text();
            console.error(`Expected JSON but got:\n${text}`);
            continue;
          }

          const data = await res.json();
          addContests(data, "national");
          addContests(data, "local");
        } catch (err) {
          console.error(`Fetch or parse failed for ${file}:`, err);
        }
      }

      setCombinedContests(combinedContestsData);
      setIsLoading(false);
    };

    fetchVotes();
  }, []);

  const renderContestTable = (contest, type) => {
    const totalVotes = Object.values(contest.candidates).reduce(
      (sum, v) => sum + v,
      0
    );

    return (
      <div key={contest.contestName}>
        <h2 className="position-header">
          {contest.contestName} ({type.toUpperCase()})
        </h2>
        <table className="contest-table">
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Votes</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(contest.candidates)
              .sort((a, b) => b[1] - a[1])
              .map(([name, votes]) => {
                const percentage = ((votes / totalVotes) * 100).toFixed(2);
                return (
                  <tr key={name}>
                    <td>{name}</td>
                    <td>{votes}</td>
                    <td>{percentage}%</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div style={{ padding: "20px", background: "#f4f4f4", color: "black" }}>
      <h1 style={{ textAlign: "center" }}>AGUITING Election Results</h1>

      {isLoading ? (
        <p>Loading results...</p>
      ) : (
        <div
          id="resultsContainer"
          style={{ margin: "30px auto", width: "80%" }}
        >
          {["national", "local"].map((type) =>
            Object.values(combinedContests[type]).map((contest) =>
              renderContestTable(contest, type)
            )
          )}
        </div>
      )}

      <style jsx>{`
        body {
          font-family: Arial;
          padding: 20px;
          background: #f4f4f4;
        }
        h1,
        h2,
        h3 {
          text-align: center;
        }
        .contest-table {
          margin: 30px auto;
          width: 80%;
          background: #fff;
          border-collapse: collapse;
        }
        .contest-table th,
        .contest-table td {
          padding: 10px;
          border: 1px solid #ccc;
          text-align: center;
        }
        .contest-table th {
          background: #007bff;
          color: white;
        }
        .position-header {
          margin-top: 40px;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
