# Virtual Assistant / Chatbot Implementation Guide for SOC-Central

## Table of Contents
1. [Overview](#overview)
2. [Architecture Options](#architecture-options)
3. [Recommended Approach: RAG with Local LLM](#recommended-approach)
4. [Model Options & Comparisons](#model-options)
5. [Security Architecture](#security-architecture)
6. [System Context Building](#system-context-building)
7. [Implementation Steps](#implementation-steps)
8. [Data Access & Security](#data-access-security)
9. [Infrastructure Requirements](#infrastructure-requirements)
10. [Cost Analysis](#cost-analysis)
11. [Testing Strategy](#testing-strategy)
12. [Challenges & Solutions](#challenges-solutions)

---

## Overview

### Goal
Create an intelligent virtual assistant that can:
- Answer questions about the SOC-Central system (e.g., "How many endpoints are in EDR?")
- Understand the codebase structure and architecture
- Access and analyze security data across all tools (GSuite, MDM, EDR, SIEM, Meraki, SonicWall)
- Provide insights and recommendations
- Maintain security and access control
- Work with open-source models (primarily LLaMA-based)

### Key Challenge
**Data Security**: Your SOC-Central system contains sensitive security data that cannot be sent to external APIs. We need a solution that keeps data secure while providing intelligent responses.

---

## Architecture Options

### Option 1: RAG (Retrieval-Augmented Generation) with Local LLM ⭐ **RECOMMENDED**
**Pros:**
- Complete data security (everything runs locally)
- Highly accurate answers using actual codebase/data
- Can cite sources and show evidence
- Works with open-source models
- Lower operating costs

**Cons:**
- Higher initial setup complexity
- Requires vector database
- Need GPU for optimal performance
- More infrastructure to maintain

### Option 2: Fine-tuned Local LLM
**Pros:**
- No external dependencies during inference
- Fast responses
- Complete data control

**Cons:**
- Expensive and time-consuming to fine-tune
- Needs re-training for updates
- Less flexible than RAG
- Large training dataset required

### Option 3: Hybrid Approach (Function Calling + RAG)
**Pros:**
- Best of both worlds
- Can execute actions AND retrieve information
- Most flexible architecture

**Cons:**
- Most complex implementation
- Requires careful orchestration

---

## Recommended Approach

### RAG (Retrieval-Augmented Generation) Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Query                               │
│          "How many EDR endpoints are active?"                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              Query Understanding Layer                        │
│  - Intent classification                                     │
│  - Entity extraction                                         │
│  - Query rewriting                                           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│           Context Retrieval System (RAG)                     │
│                                                              │
│  ┌────────────────┐  ┌──────────────────┐                  │
│  │ Vector Store   │  │  Direct Database │                  │
│  │ (Embeddings)   │  │     Queries      │                  │
│  │                │  │                  │                  │
│  │ - Code docs    │  │ - Security data  │                  │
│  │ - API specs    │  │ - User data      │                  │
│  │ - Models       │  │ - Tool uploads   │                  │
│  └────────────────┘  └──────────────────┘                  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│        Security & Access Control Layer                       │
│  - Check user permissions                                    │
│  - Filter by company                                         │
│  - Redact sensitive data                                     │
│  - Audit logging                                             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│           Local LLM (LLaMA-based)                           │
│  - Generate response using retrieved context                 │
│  - Format output                                             │
│  - Provide citations                                         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              Response to User                                │
│  "You have 47 active EDR endpoints. Here's the breakdown..." │
└─────────────────────────────────────────────────────────────┘
```

---

## Model Options

### Recommended Models (Open-Source)

#### 1. LLaMA 3.2 (3B) ⭐ **BEST FOR PRODUCTION**
- **Size:** 3 billion parameters
- **RAM Required:** 6-8GB
- **VRAM Required:** 4GB (quantized: 2GB)
- **Speed:** ~50 tokens/sec on RTX 3060
- **Accuracy:** Excellent for general tasks
- **License:** Open-source (Llama 3 Community License)
- **Use Case:** Production deployment, fast responses

**Why this model:**
- Perfect balance of performance and resource usage
- Fast inference on consumer hardware
- Excellent instruction following
- Low memory footprint with quantization

#### 2. LLaMA 3.2 (1B) - Ultra-lightweight
- **Size:** 1 billion parameters
- **RAM Required:** 4GB
- **VRAM Required:** 2GB (can run on CPU)
- **Speed:** ~100 tokens/sec on CPU
- **Accuracy:** Good for simple queries
- **Use Case:** Low-resource environments

#### 3. Mistral 7B Instruct v0.3
- **Size:** 7 billion parameters
- **RAM Required:** 16GB
- **VRAM Required:** 8GB (quantized: 4GB)
- **Speed:** ~30 tokens/sec on RTX 3060
- **Accuracy:** Excellent, better reasoning
- **Use Case:** Complex queries, better reasoning

#### 4. Phi-3 Mini (3.8B)
- **Size:** 3.8 billion parameters
- **RAM Required:** 8GB
- **VRAM Required:** 4GB
- **Speed:** ~40 tokens/sec
- **Accuracy:** Excellent for technical content
- **License:** MIT (most permissive)
- **Use Case:** Technical documentation, code understanding

#### 5. CodeLLaMA 7B (For Code Understanding)
- **Size:** 7 billion parameters
- **RAM Required:** 16GB
- **VRAM Required:** 8GB
- **Use Case:** Code-specific queries only

### Model Comparison Table

| Model | Size | RAM | VRAM | Speed | Best For | Quantization Support |
|-------|------|-----|------|-------|----------|---------------------|
| LLaMA 3.2 (1B) | 1B | 4GB | 2GB | ⭐⭐⭐⭐⭐ | Simple queries | GGUF, AWQ |
| LLaMA 3.2 (3B) | 3B | 8GB | 4GB | ⭐⭐⭐⭐ | General use | GGUF, AWQ |
| Phi-3 Mini | 3.8B | 8GB | 4GB | ⭐⭐⭐⭐ | Technical docs | GGUF |
| Mistral 7B | 7B | 16GB | 8GB | ⭐⭐⭐ | Complex reasoning | GGUF, AWQ, GPTQ |
| CodeLLaMA 7B | 7B | 16GB | 8GB | ⭐⭐⭐ | Code analysis | GGUF |

### Embedding Models (For RAG)

#### Recommended: all-MiniLM-L6-v2
- **Size:** 22M parameters (tiny!)
- **Speed:** ~1000 texts/sec on CPU
- **Quality:** Excellent for semantic search
- **Use Case:** Primary embedding model

#### Alternative: BGE-small-en-v1.5
- **Size:** 33M parameters
- **Speed:** ~800 texts/sec on CPU
- **Quality:** Better accuracy
- **Use Case:** If you need higher accuracy

---

## Security Architecture

### Data Access Control

```python
# Pseudo-code for security layer

class SecureContextRetriever:
    def retrieve_context(self, query: str, user: User) -> dict:
        """
        Retrieve context with security checks
        """
        # 1. Identify what data is needed
        required_data = self.analyze_query_intent(query)

        # 2. Check user permissions
        if not self.check_permissions(user, required_data):
            return {"error": "Access denied"}

        # 3. Filter by company
        company_filter = user.company_name

        # 4. Retrieve only allowed data
        context = {}

        if "code" in required_data:
            # Code documentation is safe to share
            context["code_info"] = self.vector_store.search(
                query,
                namespace="code_docs"
            )

        if "endpoints" in required_data:
            # Get EDR data filtered by company
            context["edr_data"] = SecurityDataUpload.objects.filter(
                tool_type='edr',
                company_name=company_filter,
                is_active=True
            ).values('record_count', 'uploaded_at')  # Only safe fields

        # 5. Redact sensitive information
        context = self.redact_sensitive_data(context)

        # 6. Log access
        self.log_data_access(user, required_data)

        return context
```

### Security Principles

1. **Principle of Least Privilege**
   - Only retrieve data user has access to
   - Filter by company/organization
   - Redact sensitive fields (IPs, emails, credentials)

2. **No Data Leakage**
   - Never embed actual security events in vector store
   - Only embed metadata and aggregations
   - Keep sensitive data in secure database

3. **Audit Everything**
   - Log all queries
   - Track what data was accessed
   - Monitor for suspicious patterns

4. **Context Isolation**
   - Each company's data is isolated
   - No cross-company information leakage
   - Separate vector stores per company (optional)

---

## System Context Building

### What to Index in Vector Store

#### 1. Code Documentation (Safe to embed)
```
- API endpoints and their purposes
- Database models and relationships
- Business logic documentation
- Function signatures and docstrings
- Configuration options
- Error codes and meanings
```

#### 2. System Metadata (Safe to embed)
```
- Tool names and capabilities
- Available endpoints
- Data field schemas
- KPI definitions
- Report templates
- Processing workflows
```

#### 3. Aggregated Statistics (Safe to embed)
```
- "EDR typically monitors X types of events"
- "GSuite dashboard shows Y metrics"
- "MDM tracks Z device attributes"
```

### What NOT to Index

❌ **Never embed in vector store:**
- Actual security events
- User credentials
- IP addresses
- Email addresses
- Specific company data
- API keys or tokens
- Detailed error logs with sensitive info

### Building the Knowledge Base

#### Step 1: Code Documentation Extraction
```python
# Extract from Python files
- Docstrings from all classes/functions
- Comments explaining business logic
- Type hints and signatures

# Extract from Django
- Model definitions → "What tables exist"
- URL patterns → "What endpoints are available"
- Serializers → "What data fields are exposed"
```

#### Step 2: Create System Documentation
```markdown
# Example knowledge base entry

## EDR Dashboard
- **Purpose:** Monitor endpoint detection and response data
- **Data Source:** Wazuh API + uploaded CSV files
- **Available Endpoints:**
  - GET /api/tool/edr/active-data/ - Get active EDR dataset
  - GET /api/tool/edr/live-data/ - Get real-time Wazuh data
  - POST /api/tool/edr/upload/ - Upload EDR data file
- **Key Metrics:**
  - Total alerts
  - Critical alerts
  - Agent status distribution
  - Top affected hosts
- **Data Fields:** rule_id, rule_level, description, agent_name, timestamp
```

#### Step 3: Generate Embeddings
```python
# Using sentence-transformers
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('all-MiniLM-L6-v2')

documents = [
    "EDR dashboard shows endpoint security metrics...",
    "GSuite monitor tracks Google Workspace activity...",
    # ... all documentation
]

embeddings = model.encode(documents)
# Store in vector database
```

---

## Implementation Steps

### Phase 1: Infrastructure Setup (Week 1)

#### 1.1 Choose Vector Database

**Option A: ChromaDB** ⭐ **RECOMMENDED**
- Lightweight, embedded
- No separate server needed
- Python-native
- Perfect for getting started

```bash
pip install chromadb
```

**Option B: Qdrant**
- Better for scale
- Requires separate service
- Excellent filtering capabilities

**Option C: PostgreSQL with pgvector**
- Use existing database
- Add vector search extension
- Simplest deployment

```sql
CREATE EXTENSION vector;
```

#### 1.2 Setup LLM Inference

**Using Ollama** ⭐ **RECOMMENDED**
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull model
ollama pull llama3.2:3b

# Test
ollama run llama3.2:3b "Hello, test"
```

**Using llama.cpp (Alternative)**
```bash
# Build llama.cpp
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp && make

# Download quantized model
wget https://huggingface.co/TheBloke/Llama-3.2-3B-GGUF/resolve/main/llama-3.2-3b.Q4_K_M.gguf

# Run
./main -m llama-3.2-3b.Q4_K_M.gguf -p "Hello" -n 128
```

#### 1.3 Setup Python Dependencies

```bash
# Create new virtual environment
python -m venv venv_chatbot
source venv_chatbot/bin/activate  # Windows: venv_chatbot\Scripts\activate

# Install core packages
pip install \
    chromadb \
    sentence-transformers \
    ollama \
    langchain \
    langchain-community \
    django-cors-headers \
    psycopg2-binary
```

### Phase 2: Knowledge Base Creation (Week 1-2)

#### 2.1 Extract Code Documentation

Create: `backend/tool/services/code_extractor.py`

```python
"""
Extract documentation from codebase for RAG system
"""
import ast
import os
from pathlib import Path
from typing import List, Dict

class CodeDocumentationExtractor:
    def __init__(self, base_dir: str):
        self.base_dir = Path(base_dir)
        self.documents = []

    def extract_all(self) -> List[Dict]:
        """Extract docs from all Python files"""

        # 1. Extract from models.py files
        self.extract_models()

        # 2. Extract from views
        self.extract_views()

        # 3. Extract from URLs
        self.extract_urls()

        # 4. Extract from serializers
        self.extract_serializers()

        return self.documents

    def extract_models(self):
        """Extract model definitions"""
        # Parse models.py and extract:
        # - Model names
        # - Field definitions
        # - Relationships
        # - Methods
        pass

    def extract_urls(self):
        """Extract API endpoints"""
        # Parse urls.py files to get:
        # - Endpoint paths
        # - View names
        # - HTTP methods
        pass
```

#### 2.2 Create System Documentation

Create: `backend/tool/knowledge_base/system_docs/`

Directory structure:
```
knowledge_base/
├── system_docs/
│   ├── 01_overview.md
│   ├── 02_authentication.md
│   ├── 03_tools_overview.md
│   ├── 04_edr_dashboard.md
│   ├── 05_gsuite_dashboard.md
│   ├── 06_mdm_dashboard.md
│   ├── 07_siem_dashboard.md
│   ├── 08_meraki_dashboard.md
│   ├── 09_sonicwall_dashboard.md
│   ├── 10_api_endpoints.md
│   ├── 11_data_models.md
│   └── 12_security_architecture.md
```

Example: `04_edr_dashboard.md`
```markdown
# EDR (Endpoint Detection and Response) Dashboard

## Purpose
The EDR dashboard monitors endpoint security through Wazuh integration and CSV file uploads.

## Available Endpoints

### GET /api/tool/edr/active-data/
**Purpose:** Retrieve active EDR dataset
**Authentication:** Required (JWT token)
**Permissions:** User must have access to company data
**Response Fields:**
- processed_data: JSON object with EDR events
- record_count: Number of records
- uploaded_at: Dataset timestamp
- file_name: Original file name

### POST /api/tool/edr/live-data/
**Purpose:** Fetch real-time data from Wazuh API
**Authentication:** Required
**Required Body:**
- wazuh_url: Wazuh server URL
- username: Wazuh username
- password: Wazuh password
**Response:** Real-time alerts from Wazuh

### POST /api/tool/edr/upload/
**Purpose:** Upload EDR data file
**Authentication:** Required
**Supported Formats:** CSV, XLSX
**Expected Columns:** rule_id, rule_level, description, agent_name, timestamp

## Data Processing
- Deduplication by rule_id + agent_name + timestamp
- Severity calculation based on rule_level
- MITRE ATT&CK mapping
- Whitelist filtering

## Dashboard KPIs
1. Total Alerts
2. Critical Alerts (rule_level >= 12)
3. High Severity (rule_level 10-11)
4. Medium Severity (rule_level 7-9)
5. Low Severity (rule_level < 7)
6. Active Agents
7. Top Affected Hosts
8. Alert Categories Distribution

## Sample Questions This Dashboard Can Answer
- "How many EDR endpoints are monitored?"
- "What are the critical alerts in EDR?"
- "Which hosts have the most EDR alerts?"
- "Show me EDR alert severity distribution"
- "What is the EDR data upload process?"
```

#### 2.3 Build Vector Store

Create: `backend/tool/services/rag_setup.py`

```python
"""
Setup RAG system with vector store
"""
import chromadb
from sentence_transformers import SentenceTransformer
from pathlib import Path
import json

class RAGSystemSetup:
    def __init__(self):
        # Initialize ChromaDB
        self.chroma_client = chromadb.PersistentClient(
            path="./chroma_db"
        )

        # Initialize embedding model
        self.embedder = SentenceTransformer('all-MiniLM-L6-v2')

        # Create/get collection
        self.collection = self.chroma_client.get_or_create_collection(
            name="soc_central_knowledge",
            metadata={"description": "SOC Central system knowledge base"}
        )

    def index_documents(self, docs_dir: str):
        """Index all markdown documentation"""
        docs_path = Path(docs_dir)

        documents = []
        metadatas = []
        ids = []

        # Read all markdown files
        for idx, md_file in enumerate(docs_path.glob("*.md")):
            with open(md_file, 'r', encoding='utf-8') as f:
                content = f.read()

                # Split into chunks (simple approach)
                chunks = self.chunk_document(content, chunk_size=500)

                for chunk_idx, chunk in enumerate(chunks):
                    documents.append(chunk)
                    metadatas.append({
                        "source": md_file.name,
                        "type": "documentation",
                        "chunk_index": chunk_idx
                    })
                    ids.append(f"{md_file.stem}_{chunk_idx}")

        # Generate embeddings
        embeddings = self.embedder.encode(documents).tolist()

        # Add to ChromaDB
        self.collection.add(
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )

        print(f"Indexed {len(documents)} document chunks")

    def chunk_document(self, text: str, chunk_size: int = 500) -> List[str]:
        """Split document into overlapping chunks"""
        # Simple chunking by paragraphs
        paragraphs = text.split('\n\n')
        chunks = []
        current_chunk = ""

        for para in paragraphs:
            if len(current_chunk) + len(para) < chunk_size:
                current_chunk += para + "\n\n"
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = para + "\n\n"

        if current_chunk:
            chunks.append(current_chunk.strip())

        return chunks

    def index_code_structure(self):
        """Index code structure from models/views/urls"""
        # Extract API endpoints
        endpoints = self.extract_api_endpoints()

        # Create documents
        for endpoint in endpoints:
            doc = f"""
            Endpoint: {endpoint['method']} {endpoint['path']}
            Purpose: {endpoint['description']}
            Authentication: {endpoint['auth_required']}
            Permissions: {endpoint['permissions']}
            """

            embedding = self.embedder.encode([doc])[0].tolist()

            self.collection.add(
                embeddings=[embedding],
                documents=[doc],
                metadatas=[{"type": "api_endpoint", "path": endpoint['path']}],
                ids=[f"endpoint_{endpoint['path'].replace('/', '_')}"]
            )

    def search(self, query: str, n_results: int = 5) -> dict:
        """Search for relevant context"""
        query_embedding = self.embedder.encode([query])[0].tolist()

        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results
        )

        return {
            "documents": results['documents'][0],
            "metadatas": results['metadatas'][0],
            "distances": results['distances'][0]
        }

# Setup script
if __name__ == "__main__":
    rag = RAGSystemSetup()
    rag.index_documents("./knowledge_base/system_docs/")
    rag.index_code_structure()
    print("RAG system setup complete!")
```

### Phase 3: Chatbot Service Implementation (Week 2-3)

#### 3.1 Create Chatbot Service

Create: `backend/tool/services/chatbot_service.py`

```python
"""
Main chatbot service with RAG and LLM integration
"""
import ollama
from typing import Dict, List
from django.contrib.auth import get_user_model
from .rag_setup import RAGSystemSetup
from tool.models import SecurityDataUpload, ChatConversation, ChatMessage

User = get_user_model()

class SecureSOCChatbot:
    def __init__(self):
        self.rag = RAGSystemSetup()
        self.model_name = "llama3.2:3b"

    def chat(self, user: User, message: str, session_id: str) -> Dict:
        """
        Main chat interface with security
        """
        # 1. Analyze query intent
        intent = self.analyze_intent(message)

        # 2. Retrieve context with security
        context = self.retrieve_secure_context(user, message, intent)

        # 3. Check if query is allowed
        if context.get("error"):
            return {"response": context["error"], "error": True}

        # 4. Build prompt
        prompt = self.build_prompt(message, context)

        # 5. Generate response using local LLM
        response = self.generate_response(prompt)

        # 6. Save conversation
        self.save_conversation(user, session_id, message, response, context)

        # 7. Audit log
        self.log_query(user, message, intent)

        return {
            "response": response,
            "sources": context.get("sources", []),
            "data_accessed": context.get("data_types", [])
        }

    def analyze_intent(self, query: str) -> Dict:
        """
        Determine what the user is asking about
        """
        query_lower = query.lower()

        intent = {
            "type": "general",
            "needs_data": False,
            "tools": [],
            "data_types": []
        }

        # Check for tool mentions
        tool_keywords = {
            "edr": ["edr", "endpoint", "wazuh", "agent"],
            "gsuite": ["gsuite", "google", "workspace", "gmail"],
            "mdm": ["mdm", "mobile", "device"],
            "siem": ["siem", "log", "event"],
            "meraki": ["meraki", "network", "wifi"],
            "sonicwall": ["sonicwall", "firewall"]
        }

        for tool, keywords in tool_keywords.items():
            if any(kw in query_lower for kw in keywords):
                intent["tools"].append(tool)

        # Check if needs live data
        data_keywords = ["how many", "count", "total", "show me", "list"]
        if any(kw in query_lower for kw in data_keywords):
            intent["needs_data"] = True
            intent["type"] = "data_query"

        # Check for code/documentation questions
        code_keywords = ["endpoint", "api", "how to", "what is"]
        if any(kw in query_lower for kw in code_keywords):
            intent["type"] = "documentation"

        return intent

    def retrieve_secure_context(self, user: User, query: str, intent: Dict) -> Dict:
        """
        Retrieve context with security checks
        """
        context = {
            "rag_results": [],
            "database_results": [],
            "sources": [],
            "data_types": []
        }

        # 1. Always search documentation (safe)
        rag_results = self.rag.search(query, n_results=3)
        context["rag_results"] = rag_results["documents"]
        context["sources"] = [m["source"] for m in rag_results["metadatas"]]

        # 2. If needs data access
        if intent["needs_data"]:
            # Check permissions
            if not user.is_authenticated:
                return {"error": "Authentication required for data access"}

            # Get company filter
            company_name = getattr(user, 'company_name', 'default_company')

            # Retrieve aggregated data only (no sensitive details)
            for tool in intent["tools"]:
                tool_data = self.get_aggregated_tool_data(
                    tool,
                    company_name
                )
                if tool_data:
                    context["database_results"].append(tool_data)
                    context["data_types"].append(tool)

        return context

    def get_aggregated_tool_data(self, tool_type: str, company_name: str) -> Dict:
        """
        Get aggregated statistics (safe to share)
        """
        try:
            active_upload = SecurityDataUpload.objects.get(
                tool_type=tool_type,
                company_name=company_name,
                is_active=True
            )

            # Return only aggregated stats
            data = active_upload.processed_data

            if tool_type == "edr":
                return {
                    "tool": "EDR",
                    "total_alerts": data.get("total_alerts", 0),
                    "critical_count": len([
                        a for a in data.get("alerts", [])
                        if a.get("rule_level", 0) >= 12
                    ]),
                    "total_agents": data.get("total_agents", 0),
                    "last_updated": str(active_upload.uploaded_at),
                    "record_count": active_upload.record_count
                }

            # Add similar logic for other tools

        except SecurityDataUpload.DoesNotExist:
            return None

    def build_prompt(self, user_query: str, context: Dict) -> str:
        """
        Build prompt for LLM
        """
        prompt = f"""You are a helpful SOC Central assistant. Answer the user's question using the provided context.

Context from documentation:
{chr(10).join(context["rag_results"])}

"""

        if context["database_results"]:
            prompt += f"""
Current data statistics:
{json.dumps(context["database_results"], indent=2)}

"""

        prompt += f"""
User Question: {user_query}

Instructions:
- Provide accurate, concise answers
- Cite sources when possible
- If you don't know, say so
- Never make up data
- Keep security in mind

Answer:"""

        return prompt

    def generate_response(self, prompt: str) -> str:
        """
        Generate response using local LLM (Ollama)
        """
        try:
            response = ollama.generate(
                model=self.model_name,
                prompt=prompt,
                options={
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "max_tokens": 500
                }
            )
            return response['response']
        except Exception as e:
            return f"Error generating response: {str(e)}"

    def save_conversation(self, user, session_id, query, response, context):
        """Save to database"""
        # Get or create conversation
        conversation, _ = ChatConversation.objects.get_or_create(
            user=user,
            session_id=session_id,
            defaults={
                "company_name": getattr(user, 'company_name', 'default_company'),
                "title": query[:100]
            }
        )

        # Save user message
        ChatMessage.objects.create(
            conversation=conversation,
            message_type='user',
            content=query
        )

        # Save bot response
        ChatMessage.objects.create(
            conversation=conversation,
            message_type='bot',
            content=response,
            app_context_used=context,
            ai_model_used=self.model_name
        )

    def log_query(self, user, query, intent):
        """Audit logging"""
        logger.info(f"Chatbot query by {user.username}: {query[:100]} | Intent: {intent['type']}")
```

#### 3.2 Create Django API View

Create: `backend/tool/views/chatbot_views.py`

```python
"""
Chatbot API endpoints
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from tool.services.chatbot_service import SecureSOCChatbot
import uuid

class SOCChatbotView(APIView):
    permission_classes = [IsAuthenticated]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.chatbot = SecureSOCChatbot()

    def post(self, request):
        """
        Handle chat messages

        Body:
        {
            "message": "How many EDR endpoints are active?",
            "session_id": "optional-session-id"
        }
        """
        message = request.data.get('message')
        session_id = request.data.get('session_id', str(uuid.uuid4()))

        if not message:
            return Response(
                {"error": "Message is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            result = self.chatbot.chat(
                user=request.user,
                message=message,
                session_id=session_id
            )

            return Response({
                "response": result["response"],
                "session_id": session_id,
                "sources": result.get("sources", []),
                "data_accessed": result.get("data_accessed", []),
                "error": result.get("error", False)
            })

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ChatHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id=None):
        """Get chat history"""
        from tool.models import ChatConversation

        if session_id:
            # Get specific conversation
            try:
                conversation = ChatConversation.objects.get(
                    session_id=session_id,
                    user=request.user
                )
                messages = conversation.messages.all()

                return Response({
                    "session_id": session_id,
                    "title": conversation.title,
                    "messages": [
                        {
                            "type": m.message_type,
                            "content": m.content,
                            "timestamp": m.created_at.isoformat()
                        }
                        for m in messages
                    ]
                })
            except ChatConversation.DoesNotExist:
                return Response(
                    {"error": "Conversation not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # List all conversations
            conversations = ChatConversation.objects.filter(
                user=request.user
            ).order_by('-updated_at')[:20]

            return Response({
                "conversations": [
                    {
                        "session_id": c.session_id,
                        "title": c.title,
                        "last_updated": c.updated_at.isoformat(),
                        "message_count": c.messages.count()
                    }
                    for c in conversations
                ]
            })
```

Add to `backend/tool/urls.py`:
```python
from .views.chatbot_views import SOCChatbotView, ChatHistoryView

urlpatterns += [
    path('chatbot/', SOCChatbotView.as_view(), name='soc-chatbot'),
    path('chatbot/history/', ChatHistoryView.as_view(), name='chat-history'),
    path('chatbot/history/<str:session_id>/', ChatHistoryView.as_view(), name='chat-history-detail'),
]
```

### Phase 4: Frontend Integration (Week 3-4)

#### 4.1 Create Chatbot Component

Create: `soccentral/src/components/chatbot/SOCChatbot.tsx`

```typescript
import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader } from 'lucide-react';
import axios from 'axios';

interface Message {
  type: 'user' | 'bot';
  content: string;
  timestamp: string;
  sources?: string[];
}

export const SOCChatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate session ID
    setSessionId(crypto.randomUUID());
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      type: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('/api/tool/chatbot/', {
        message: input,
        session_id: sessionId
      });

      const botMessage: Message = {
        type: 'bot',
        content: response.data.response,
        timestamp: new Date().toISOString(),
        sources: response.data.sources
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        type: 'bot',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Bot size={24} />
          SOC Central Assistant
        </h1>
        <p className="text-sm opacity-90">Ask me anything about your security data</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <Bot size={48} className="mx-auto mb-4 opacity-50" />
            <p>How can I help you today?</p>
            <div className="mt-4 space-y-2">
              <p className="text-sm">Try asking:</p>
              <div className="space-y-1">
                <button
                  onClick={() => setInput("How many EDR endpoints are active?")}
                  className="block mx-auto text-sm text-blue-600 hover:underline"
                >
                  "How many EDR endpoints are active?"
                </button>
                <button
                  onClick={() => setInput("What endpoints does the EDR dashboard have?")}
                  className="block mx-auto text-sm text-blue-600 hover:underline"
                >
                  "What endpoints does the EDR dashboard have?"
                </button>
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.type === 'bot' && (
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <Bot size={20} className="text-white" />
                </div>
              </div>
            )}

            <div
              className={`max-w-2xl rounded-lg p-3 ${
                msg.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white shadow'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>

              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500">Sources:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {msg.sources.map((source, i) => (
                      <span
                        key={i}
                        className="text-xs bg-gray-100 px-2 py-1 rounded"
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {msg.type === 'user' && (
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center">
                  <User size={20} className="text-white" />
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <Bot size={20} className="text-white" />
              </div>
            </div>
            <div className="bg-white shadow rounded-lg p-3">
              <Loader className="animate-spin" size={20} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-white p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask me anything..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send size={20} />
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
```

### Phase 5: Testing & Optimization (Week 4)

#### 5.1 Test Queries

Create test suite: `backend/tool/tests/test_chatbot.py`

```python
from django.test import TestCase
from django.contrib.auth import get_user_model
from tool.services.chatbot_service import SecureSOCChatbot

User = get_user_model()

class ChatbotTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='password123',
            company_name='test_company'
        )
        self.chatbot = SecureSOCChatbot()

    def test_documentation_query(self):
        """Test query about documentation"""
        response = self.chatbot.chat(
            user=self.user,
            message="What endpoints does EDR have?",
            session_id="test-session"
        )

        self.assertFalse(response.get('error'))
        self.assertIn('response', response)
        self.assertTrue(len(response['response']) > 0)

    def test_data_query_with_permission(self):
        """Test query that needs data access"""
        response = self.chatbot.chat(
            user=self.user,
            message="How many EDR alerts do we have?",
            session_id="test-session"
        )

        self.assertFalse(response.get('error'))

    def test_security_isolation(self):
        """Test that users can't access other company data"""
        # Create user from different company
        other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='password123',
            company_name='other_company'
        )

        response = self.chatbot.chat(
            user=other_user,
            message="Show me test_company's data",
            session_id="test-session"
        )

        # Should not get test_company data
        self.assertTrue(
            'other_company' in str(response) or
            'no access' in response['response'].lower()
        )
```

---

## Data Access & Security

### Access Control Matrix

| User Role | Code Docs | Own Company Data | Other Company Data | System Admin |
|-----------|-----------|------------------|-------------------|--------------|
| Regular User | ✅ Yes | ✅ Yes (aggregated) | ❌ No | ❌ No |
| Admin | ✅ Yes | ✅ Yes (full) | ❌ No | ⚠️ Limited |
| Super Admin | ✅ Yes | ✅ Yes (full) | ✅ Yes | ✅ Yes |

### Data Exposure Levels

**Level 1: Public (Safe for all users)**
- API endpoint documentation
- System architecture overview
- Feature descriptions
- Configuration options

**Level 2: Company-Aggregated (Authenticated users)**
- Total counts (alerts, devices, users)
- Severity distributions
- Time-based trends
- Top categories

**Level 3: Company-Detailed (Admins only)**
- Specific host names
- User names (within company)
- Detailed alert descriptions

**Level 4: Cross-Company (Super admin only)**
- All company data
- System-wide statistics
- User management

### Redaction Rules

```python
SENSITIVE_FIELDS = [
    'password',
    'api_key',
    'token',
    'secret',
    'credential',
    'ip_address',  # Optional: may want to show
    'email',       # Optional: may want to show
]

def redact_sensitive_data(data: dict) -> dict:
    """Remove sensitive fields"""
    for key in list(data.keys()):
        if any(sensitive in key.lower() for sensitive in SENSITIVE_FIELDS):
            data[key] = "[REDACTED]"
    return data
```

---

## Infrastructure Requirements

### Minimum Requirements (Development)

**Hardware:**
- CPU: 4 cores
- RAM: 16GB
- Storage: 50GB SSD
- GPU: Optional (CPU inference works)

**Software:**
- Python 3.10+
- PostgreSQL 14+
- Ollama OR llama.cpp

### Recommended Requirements (Production)

**Hardware:**
- CPU: 8 cores (Intel Xeon or AMD EPYC)
- RAM: 32GB
- Storage: 100GB NVMe SSD
- GPU: NVIDIA RTX 3060 (12GB VRAM) or better

**Software:**
- Python 3.11
- PostgreSQL 15 with pgvector extension
- Ollama
- Redis (for caching)
- Nginx (reverse proxy)

### GPU vs CPU Performance

| Model | Hardware | Speed | Use Case |
|-------|----------|-------|----------|
| LLaMA 3.2 (1B) | CPU (8 cores) | ~50 tokens/sec | Good enough |
| LLaMA 3.2 (3B) | CPU (8 cores) | ~20 tokens/sec | Usable |
| LLaMA 3.2 (3B) | RTX 3060 | ~50 tokens/sec | Recommended |
| Mistral 7B | RTX 3060 | ~30 tokens/sec | Best quality |

### Quantization Options

Quantization reduces model size and memory usage:

| Format | Size Reduction | Quality Loss | Speed |
|--------|---------------|--------------|-------|
| FP16 | 50% | None | Baseline |
| Q8 | 75% | Minimal | +20% |
| Q4 | 87% | Small | +40% |
| Q2 | 93% | Moderate | +60% |

**Recommendation:** Use Q4 quantization for best balance

---

## Cost Analysis

### Setup Costs

| Component | Cost | Notes |
|-----------|------|-------|
| GPU (RTX 3060) | $300-400 | Optional, one-time |
| Development Time | 3-4 weeks | Your time |
| Cloud GPU (alternative) | $0.50-1/hour | If hosting on cloud |

### Operating Costs (Monthly)

**Self-Hosted (Recommended):**
- Electricity: ~$10-20/month
- No API costs
- Total: $10-20/month

**Cloud-Hosted:**
- GPU instance: $200-500/month
- Storage: $10/month
- Bandwidth: $5-20/month
- Total: $215-530/month

### Comparison with Cloud APIs

| Option | Monthly Cost | Data Privacy | Latency |
|--------|-------------|--------------|---------|
| **Local RAG + LLaMA** | $10-20 | ✅ Full | 1-2s |
| OpenAI GPT-4 | $500-2000 | ❌ No | 0.5s |
| Anthropic Claude | $500-2000 | ❌ No | 0.5s |
| Google Gemini Pro | $100-500 | ❌ No | 1s |

---

## Testing Strategy

### Test Categories

#### 1. Documentation Queries
```
✓ "What endpoints does EDR have?"
✓ "How do I upload GSuite data?"
✓ "What fields are in the MDM dashboard?"
✓ "Explain the authentication system"
```

#### 2. Data Queries
```
✓ "How many EDR endpoints are active?"
✓ "What's our critical alert count?"
✓ "Show me device compliance rate"
✓ "What are today's top threats?"
```

#### 3. Security Tests
```
✓ User A cannot access User B's data
✓ Non-admin cannot see system statistics
✓ Redaction of sensitive fields works
✓ Audit logs are created
```

#### 4. Edge Cases
```
✓ Empty dataset handling
✓ Malformed queries
✓ Very long messages
✓ Special characters
✓ Multiple languages
```

### Performance Benchmarks

Target metrics:
- Response time: < 3 seconds
- Accuracy: > 85% (measured by human eval)
- Context relevance: > 90%
- Security compliance: 100%

---

## Challenges & Solutions

### Challenge 1: Context Length Limits

**Problem:** LLMs have token limits (typically 4K-8K tokens)

**Solutions:**
1. Smart chunking of documentation
2. Hierarchical retrieval (search → refine → search again)
3. Summarization of long contexts
4. Use models with longer context (Mistral supports 32K)

### Challenge 2: Hallucination

**Problem:** LLM may make up information

**Solutions:**
1. Always include "cite sources" in prompt
2. Use lower temperature (0.3-0.5) for factual queries
3. Implement answer verification layer
4. Show confidence scores
5. Add disclaimer: "Verify critical information"

### Challenge 3: Performance on CPU

**Problem:** Inference may be slow without GPU

**Solutions:**
1. Use smaller models (1B-3B)
2. Use aggressive quantization (Q4)
3. Implement response caching
4. Pre-compute common queries
5. Use llama.cpp (optimized for CPU)

### Challenge 4: Keeping Knowledge Up-to-Date

**Problem:** Code changes, new features added

**Solutions:**
1. Automated doc extraction from code
2. Scheduled re-indexing (daily/weekly)
3. Incremental updates (add new docs only)
4. Version tracking in metadata
5. Manual review for critical changes

### Challenge 5: Multi-Company Isolation

**Problem:** Ensuring data doesn't leak between companies

**Solutions:**
1. Company-specific vector store namespaces
2. Database-level filtering
3. Query rewriting with company context
4. Audit all cross-company queries
5. Regular security testing

---

## Implementation Checklist

### Week 1: Setup
- [ ] Install Ollama and pull LLaMA 3.2 (3B)
- [ ] Install ChromaDB and sentence-transformers
- [ ] Create knowledge base directory structure
- [ ] Write system documentation (12 markdown files)
- [ ] Test embedding generation

### Week 2: RAG System
- [ ] Implement code documentation extractor
- [ ] Build vector store indexing pipeline
- [ ] Test semantic search accuracy
- [ ] Implement security filtering layer
- [ ] Create aggregated data queries

### Week 3: Chatbot Service
- [ ] Implement intent analyzer
- [ ] Build prompt engineering system
- [ ] Create Django API views
- [ ] Add conversation persistence
- [ ] Implement audit logging

### Week 4: Frontend & Testing
- [ ] Build React chatbot component
- [ ] Add to main dashboard
- [ ] Write test suite (30+ tests)
- [ ] Performance benchmarking
- [ ] Security audit
- [ ] Documentation

---

## Next Steps After Reading

1. **Experiment with Ollama**
   ```bash
   # Install and test
   curl -fsSL https://ollama.com/install.sh | sh
   ollama pull llama3.2:3b
   ollama run llama3.2:3b "Explain RAG in simple terms"
   ```

2. **Test ChromaDB**
   ```python
   import chromadb
   client = chromadb.Client()
   collection = client.create_collection("test")
   collection.add(
       documents=["This is a test document"],
       ids=["doc1"]
   )
   results = collection.query(query_texts=["test"], n_results=1)
   print(results)
   ```

3. **Create Knowledge Base Outline**
   - List all tools and their capabilities
   - Document all API endpoints
   - Describe data models
   - Write example queries for each tool

4. **Review Security Requirements**
   - Define what data can be shared
   - Document access control rules
   - Plan audit logging
   - Test company isolation

5. **Prepare Questions for Discussion**
   - Infrastructure preferences (self-hosted vs cloud)
   - Model size preferences (faster vs more accurate)
   - Response time requirements
   - Budget constraints

---

## Resources & References

### Documentation
- [Ollama Docs](https://ollama.com/docs)
- [ChromaDB Guide](https://docs.trychroma.com/)
- [LangChain Python](https://python.langchain.com/docs/get_started/introduction)
- [LLaMA 3.2 Model Card](https://huggingface.co/meta-llama/Llama-3.2-3B)

### Tutorials
- [Building RAG from Scratch](https://python.langchain.com/docs/use_cases/question_answering/)
- [Local LLM Deployment Guide](https://github.com/ggerganov/llama.cpp)

### Tools
- Ollama: https://ollama.com
- ChromaDB: https://www.trychroma.com
- llama.cpp: https://github.com/ggerganov/llama.cpp
- Sentence Transformers: https://www.sbert.net

---

## Glossary

**RAG (Retrieval-Augmented Generation):** Technique that retrieves relevant information before generating a response

**Vector Store:** Database optimized for semantic search using embeddings

**Embedding:** Numerical representation of text that captures meaning

**Quantization:** Technique to reduce model size by using lower precision numbers

**Context Window:** Maximum amount of text an LLM can process at once

**Hallucination:** When an LLM generates plausible-sounding but incorrect information

**Token:** Basic unit of text (roughly 0.75 words in English)

**Inference:** Process of running a trained model to generate outputs

**Fine-tuning:** Training a pre-trained model on specific data

---

## Conclusion

This implementation guide provides a comprehensive roadmap for building a secure, intelligent virtual assistant for SOC-Central. The recommended approach using RAG with local LLMs offers the best balance of:

✅ **Security** - All data stays local
✅ **Accuracy** - Uses actual codebase documentation
✅ **Cost** - No expensive API calls
✅ **Flexibility** - Easy to update and extend
✅ **Performance** - Fast enough for production use

The estimated timeline is **3-4 weeks** for a working MVP, with potential for ongoing improvements.

**Next Action:** Review this guide, test the recommended tools, and we can begin implementation when you're ready!
