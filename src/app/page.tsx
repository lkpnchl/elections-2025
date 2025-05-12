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
      <div key={contest.contestName} className="my-8">
        <h2 className="text-2xl font-semibold text-center mb-4">
          {contest.contestName} ({type.toUpperCase()})
        </h2>
        <table className="w-full table-auto border-collapse bg-white">
          <thead>
            <tr>
              <th className="px-4 py-2 text-center bg-blue-600 text-white">
                Candidate
              </th>
              <th className="px-4 py-2 text-center bg-blue-600 text-white">
                Votes
              </th>
              <th className="px-4 py-2 text-center bg-blue-600 text-white">
                Percentage
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(contest.candidates)
              .sort((a, b) => b[1] - a[1])
              .map(([name, votes]) => {
                const percentage = ((votes / totalVotes) * 100).toFixed(2);
                return (
                  <tr key={name}>
                    <td className="px-4 py-2 text-center border">{name}</td>
                    <td className="px-4 py-2 text-center border">{votes}</td>
                    <td className="px-4 py-2 text-center border">
                      {percentage}%
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-100 text-black">
      <h1 className="text-4xl text-center font-bold mb-8">
        AGUITING Election Results
      </h1>

      {isLoading ? (
        <p className="text-center text-xl">Loading results...</p>
      ) : (
        <div className="max-w-4xl mx-auto">
          {["national", "local"].map((type) =>
            Object.values(combinedContests[type]).map((contest) =>
              renderContestTable(contest, type)
            )
          )}
        </div>
      )}
    </div>
  );
}
