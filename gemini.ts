export async function getAIInsights(dataSummary: any) {
  try {
    const response = await fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataSummary })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || "Failed to run audit");
    }
    
    return data;
  } catch (error: any) {
    console.error("AI Audit Error:", error);
    return { error: error.message || "Connection to Coach failed" };
  }
}
