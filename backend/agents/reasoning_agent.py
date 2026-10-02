import os
from langchain_ollama import OllamaLLM
from langchain_core.prompts import PromptTemplate

class LocalLLMUnavailableError(Exception):
    """Raised when the local Ollama LLM service is unreachable, times out, or fails."""
    pass

class ReasoningAgent:
    def __init__(self, model: str = None, base_url: str = None):
        self.model = model or os.environ.get("LLM_MODEL", "phi3:mini")
        self.base_url = base_url or os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
        self.timeout = int(os.environ.get("LLM_TIMEOUT_SECONDS", 60))
        
        self.llm = OllamaLLM(
            model=self.model,
            base_url=self.base_url,
            temperature=0.1,
            num_predict=500,
            timeout=self.timeout
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

    def generate(self, defect_type: str, severity: str, procedure: str) -> dict:
        filled_prompt = self.prompt.format(
            defect_type=defect_type,
            severity=severity,
            procedure=procedure[:1000] if procedure else "Standard visual and dimensional inspection required."
        )

        try:
            response = self.llm.invoke(filled_prompt)
        except Exception as e:
            raise LocalLLMUnavailableError(
                f"Local reasoning service (Ollama {self.model}) is unavailable or timed out: {str(e)}"
            ) from e

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