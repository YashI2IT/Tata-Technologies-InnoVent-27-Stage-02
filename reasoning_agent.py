from langchain_ollama import OllamaLLM
from langchain_core.prompts import PromptTemplate

class ReasoningAgent:
    def __init__(self):
        print("[ReasoningAgent] Loading Phi-3 Mini via Ollama...")
        self.llm = OllamaLLM(
            model="phi3:mini",
            temperature=0.1,
            num_predict=500
        )
        self.prompt = PromptTemplate(
            input_variables=["defect_type", "severity", "procedure"],
            template="""You are an aircraft maintenance technician assistant.
A defect has been detected on an aircraft surface.

Defect Type: {defect_type}
Severity: {severity}
Retrieved Maintenance Procedure:
{procedure}

Based on the above maintenance procedure, generate exactly 5 clear, numbered 
step-by-step repair instructions for the technician.
Each step must be specific, actionable and based ONLY on the retrieved procedure.
Do NOT invent steps not mentioned in the procedure.
Format: 
1. [Step title]: [One sentence description]
2. [Step title]: [One sentence description]
...and so on.

Repair Steps:"""
        )
        print("[ReasoningAgent] Ready ✅")

    def generate(self, defect_type: str, severity: str, procedure: str) -> dict:
        print(f"[ReasoningAgent] Generating repair steps for {defect_type}...")

        filled_prompt = self.prompt.format(
            defect_type=defect_type,
            severity=severity,
            procedure=procedure[:1000]
        )

        response = self.llm.invoke(filled_prompt)

        lines = response.strip().split('\n')
        steps = []
        for line in lines:
            line = line.strip()
            if line and line[0].isdigit() and '.' in line:
                parts = line.split('.', 1)
                if len(parts) == 2:
                    content = parts[1].strip()
                    if ':' in content:
                        title, desc = content.split(':', 1)
                        steps.append({
                            "number": len(steps) + 1,
                            "title": title.strip(),
                            "description": desc.strip()
                        })
                    else:
                        steps.append({
                            "number": len(steps) + 1,
                            "title": f"Step {len(steps)+1}",
                            "description": content
                        })

        return {
            "defect_type": defect_type,
            "severity": severity,
            "steps": steps,
            "raw_response": response
        }


if __name__ == "__main__":
    agent = ReasoningAgent()

    test_procedure = """
    Service-induced cracks in aircraft structures are generally caused by fatigue 
    or stress corrosion. Stop drill at crack tips to prevent propagation. 
    Clean area with approved solvent. Apply sealant per AMM 51-70-00.
    Inspect repair per quality standards. All repairs must equal original structure strength.
    """

    result = agent.generate(
        defect_type="crack",
        severity="high",
        procedure=test_procedure
    )

    print("\n" + "="*50)
    print("REASONING AGENT OUTPUT")
    print("="*50)
    for step in result['steps']:
        print(f"\n{step['number']}. {step['title']}")
        print(f"   {step['description']}")