import streamlit as st
import pandas as pd
import json
import datetime as dt
import logging
import shutil
from pathlib import Path

logger = logging.getLogger(__name__)

# ================== App setup ==================
st.set_page_config(page_title="AI Fitness & Nutrition Planner", layout="centered")
st.title("AI Fitness & Nutrition Planner")

# ================== Constants ==================
MODEL_NAME = "gpt-4o-mini"
MAX_INPUT_LENGTH = 200
WORKOUT_REQUIRED_KEYS = {"day", "session_type", "main"}
MEAL_REQUIRED_KEYS = {"day", "breakfast", "lunch", "dinner", "kcal"}

# ================== Data files ==================
DATA_FILES = {
    "logs.csv":  ["date","weight_kg","steps","workout_minutes","intensity","sleep_hours","mood","calories","carbs_g","protein_g","fat_g","notes"],
    "prefs.csv": ["goal","diet","kcal_target","protein_g_target","allergies","dislikes","training_days"],
    "plan.csv":  ["week_of","workouts","meals","shopping_list"],
}
for fn, cols in DATA_FILES.items():
    if not Path(fn).exists():
        pd.DataFrame(columns=cols).to_csv(fn, index=False)

def read_csv(fn, cols):
    try:
        df = pd.read_csv(fn)
        for c in cols:
            if c not in df.columns:
                df[c] = None
        return df[cols]
    except (FileNotFoundError, pd.errors.EmptyDataError, pd.errors.ParserError) as e:
        logger.warning("Failed to read %s: %s", fn, e)
        return pd.DataFrame(columns=cols)

def backup_csv(fn):
    """Create a timestamped backup before overwriting."""
    path = Path(fn)
    if path.exists() and path.stat().st_size > 0:
        ts = dt.datetime.now().strftime("%Y%m%d_%H%M%S")
        backup = path.with_suffix(f".backup_{ts}.csv")
        shutil.copy(path, backup)

logs  = read_csv("logs.csv",  DATA_FILES["logs.csv"])
prefs = read_csv("prefs.csv", DATA_FILES["prefs.csv"])
plan  = read_csv("plan.csv",  DATA_FILES["plan.csv"])

# ================== Utilities ==================
def sanitize_input(text, max_length=MAX_INPUT_LENGTH):
    """Sanitize user text before inserting into AI prompts."""
    text = str(text).replace('"', "'").replace("\\", "").replace("\n", " ")
    return text[:max_length].strip()

def _safe_str(val, default=""):
    """Convert a value to string, treating NaN/None as default."""
    if val is None or (isinstance(val, float) and val != val):
        return default
    return str(val)

def _save_prefs(d):
    backup_csv("prefs.csv")
    pd.DataFrame([d]).to_csv("prefs.csv", index=False)

def _ok(d):
    """Validate that a generated plan has the required structure and fields."""
    try:
        workouts = d.get("workouts")
        meals = d.get("meals")
        shopping = d.get("shopping_list")

        if not isinstance(workouts, list) or len(workouts) < 7:
            return False
        if not isinstance(meals, list) or len(meals) < 7:
            return False
        if not isinstance(shopping, list) or len(shopping) < 6:
            return False

        for w in workouts:
            if not isinstance(w, dict) or not WORKOUT_REQUIRED_KEYS.issubset(w.keys()):
                return False

        for m in meals:
            if not isinstance(m, dict) or not MEAL_REQUIRED_KEYS.issubset(m.keys()):
                return False

        return True
    except (TypeError, AttributeError):
        return False

# ================== Seed demo logs ==================
def _secret(key, default=None):
    try:
        return st.secrets[key]
    except (KeyError, FileNotFoundError):
        return default

if _secret("DEVELOPER_MODE", False):
    with st.expander("Developer tools"):
        c1, c2 = st.columns(2)
        with c1:
            if st.button("Seed 7 demo logs"):
                import random
                base = dt.date.today()
                for i in range(7):
                    day = base - dt.timedelta(days=6-i)
                    logs.loc[len(logs)] = [day, 86.5+i*0.1, 12000+500*i, 35, 3, 7.0, 0, 1900, 25, 160, 90, "demo"]
                backup_csv("logs.csv")
                logs.to_csv("logs.csv", index=False)
                st.success("Seeded 7 logs"); st.rerun()
        with c2:
            if st.button("Clear all plans"):
                backup_csv("plan.csv")
                pd.DataFrame(columns=DATA_FILES["plan.csv"]).to_csv("plan.csv", index=False)
                st.warning("Cleared plan.csv"); st.rerun()

# ================== Quick Log ==================
st.subheader("Quick daily log")
with st.form("log_form", clear_on_submit=True):
    c1,c2,c3 = st.columns(3)
    date  = c1.date_input("date", dt.date.today())
    wkg   = c1.number_input("weight_kg", 0.0, 400.0, step=0.1)
    steps = c1.number_input("steps", 0, 200000, step=100)
    wmin  = c2.number_input("workout_minutes", 0, 300, step=5)
    inten = c2.slider("intensity (RPE 1-5)", 1, 5, 3)
    sleep = c2.number_input("sleep_hours", 0.0, 24.0, step=0.5)
    mood  = c3.slider("mood -2..+2", -2, 2, 0)
    kcal  = c3.number_input("calories", 0, 10000, step=50)
    carbs = c3.number_input("carbs_g", 0, 1000, step=5)
    prot  = c3.number_input("protein_g", 0, 500, step=5)
    fat   = c3.number_input("fat_g", 0, 500, step=5)
    notes = st.text_input("notes")
    if st.form_submit_button("Save log"):
        logs.loc[len(logs)] = [date, wkg, steps, wmin, inten, sleep, mood, kcal, carbs, prot, fat, notes]
        backup_csv("logs.csv")
        logs.to_csv("logs.csv", index=False)
        st.success("Log saved")

# ================== Preferences (create/edit) ==================
st.subheader("Preferences")
if prefs.empty:
    goal = st.selectbox("goal", ["fat_loss","recomposition","performance"])
    diet = st.selectbox("diet", ["keto","low-carb","balanced"])
    kcal_t = st.number_input("kcal_target", 1200, 5000, 2000, step=50)
    prot_t = st.number_input("protein_g_target", 50, 300, 150, step=5)
    allergies = st.text_input("allergies", "", max_chars=MAX_INPUT_LENGTH)
    dislikes  = st.text_input("dislikes", "", max_chars=MAX_INPUT_LENGTH)
    tdays = st.text_input("training_days (e.g., Mon,Wed,Fri)", max_chars=MAX_INPUT_LENGTH)
    if st.button("Save prefs"):
        _save_prefs({
            "goal":goal,"diet":diet,"kcal_target":kcal_t,"protein_g_target":prot_t,
            "allergies":sanitize_input(allergies),"dislikes":sanitize_input(dislikes),
            "training_days":sanitize_input(tdays)
        })
        st.rerun()
else:
    cur = prefs.iloc[0].to_dict()
    with st.form("edit_prefs"):
        c1, c2 = st.columns(2)
        goal_val = _safe_str(cur.get("goal"), "fat_loss")
        diet_val = _safe_str(cur.get("diet"), "balanced")
        goal = c1.selectbox("goal", ["fat_loss","recomposition","performance"], index=["fat_loss","recomposition","performance"].index(goal_val) if goal_val in ["fat_loss","recomposition","performance"] else 0)
        diet = c1.selectbox("diet", ["keto","low-carb","balanced"], index=["keto","low-carb","balanced"].index(diet_val) if diet_val in ["keto","low-carb","balanced"] else 2)
        try:
            kcal_default = int(cur.get("kcal_target", 2000))
            prot_default = int(cur.get("protein_g_target", 150))
        except (ValueError, TypeError):
            kcal_default = 2000
            prot_default = 150
        kcal_t = c1.number_input("kcal_target", 1200, 5000, kcal_default, step=50)
        prot_t = c1.number_input("protein_g_target", 50, 300, prot_default, step=5)
        allergies = c2.text_input("allergies", _safe_str(cur.get("allergies"), ""), max_chars=MAX_INPUT_LENGTH)
        dislikes  = c2.text_input("dislikes", _safe_str(cur.get("dislikes"), ""), max_chars=MAX_INPUT_LENGTH)
        tdays = c2.text_input("training_days (e.g., Mon,Wed,Fri)", _safe_str(cur.get("training_days"), "Mon,Wed,Fri"), max_chars=MAX_INPUT_LENGTH)
        save = st.form_submit_button("Update prefs")
    cols = st.columns(2)
    if save:
        _save_prefs({
            "goal":goal,"diet":diet,"kcal_target":kcal_t,"protein_g_target":prot_t,
            "allergies":sanitize_input(allergies),"dislikes":sanitize_input(dislikes),
            "training_days":sanitize_input(tdays)
        })
        st.success("Preferences updated"); st.rerun()
    if cols[1].button("Reset prefs (clear)"):
        backup_csv("prefs.csv")
        pd.DataFrame(columns=DATA_FILES["prefs.csv"]).to_csv("prefs.csv", index=False)
        st.warning("Preferences cleared"); st.rerun()

# ================== Manual prompt (optional) ==================
week_of = (dt.date.today() + dt.timedelta(days=(7 - dt.date.today().weekday())))  # next Monday
last14 = logs.tail(14).to_dict(orient="records")
pref = prefs.iloc[0].to_dict() if not prefs.empty else {}

safe_pref = {k: sanitize_input(v) if isinstance(v, str) else v for k, v in pref.items()}

with st.expander("Manual copy-paste prompt (optional)"):
    prompt = f"""
You are a certified coach and nutritionist. Create a one-week plan starting {week_of}.

Constraints:
- Goal: {safe_pref.get('goal')}
- Diet: {safe_pref.get('diet')}
- Daily kcal target: {safe_pref.get('kcal_target')}
- Protein target: {safe_pref.get('protein_g_target','')} g
- Allergies: {safe_pref.get('allergies')}
- Dislikes: {safe_pref.get('dislikes')}
- Training days: {safe_pref.get('training_days')}

Input logs (last 14 days JSON):
{json.dumps(last14, default=str)}

Return strict JSON with keys:
- workouts: [{{day, session_type, warmup, main, accessories, RPE_target, notes}}]  # exactly 7 items (Mon-Sun)
- meals: [{{day, breakfast, lunch, dinner, snacks, kcal, protein_g, carbs_g, fat_g}}]  # exactly 7 items (Mon-Sun)
- shopping_list: [string]  # 20-40 items with quantities and units, group by category within strings

Rules: For keto keep carbs <= 30-50 g/day. Weekday sessions <= 45 min. Use UK-available foods only.
"""
    st.code(prompt, language="markdown")

# ================== OpenAI generation ==================
st.subheader("Generate next-week plan (automatic)")
st.caption("Requires OPENAI_API_KEY in .streamlit/secrets.toml")

if len(logs) > 0 and len(logs) < 7:
    st.warning(f"Only {len(logs)} log(s) recorded. The AI produces better plans with 7+ days of data.")

def generate_plan_with_openai(pref_dict, logs_list, week_date, max_tokens=2400, temperature=0.4):
    from openai import OpenAI
    client = OpenAI(api_key=_secret("OPENAI_API_KEY"))

    safe = {k: sanitize_input(v) if isinstance(v, str) else v for k, v in pref_dict.items()}

    system_msg = (
        "You are a certified coach and nutritionist. "
        f"Create a realistic one-week plan starting {week_date}. "
        "Output JSON ONLY with keys workouts, meals, shopping_list. Requirements:\n"
        "- Exactly 7 workout objects (Mon-Sun). Each has: day, session_type, warmup, main (sets x reps or intervals with loads or paces), accessories, RPE_target, notes.\n"
        "- Exactly 7 meal objects (Mon-Sun). Each has: day, breakfast, lunch, dinner, snacks, kcal, protein_g, carbs_g, fat_g. Hit daily protein target; weekdays prep <= 20 min.\n"
        "- shopping_list is 20-40 items with quantities and units (e.g., 'chicken breast 1.2 kg'), grouped by category in the string (e.g., 'Meat: ...').\n"
        "If diet is keto, keep carbs <= 30-50 g/day. Keep weekday sessions <= 45 min. UK-available foods only."
    )
    user_payload = {"prefs": safe, "logs_last14": logs_list}

    resp = client.chat.completions.create(
        model=MODEL_NAME,
        response_format={"type": "json_object"},
        temperature=temperature,
        max_tokens=max_tokens,
        messages=[
            {"role":"system","content": system_msg},
            {"role":"user","content": json.dumps(user_payload, default=str)},
        ],
    )
    content = resp.choices[0].message.content
    return json.loads(content)

colA, colB = st.columns(2)
with colA:
    if st.button("Generate plan with OpenAI"):
        if not _secret("OPENAI_API_KEY"):
            st.error("Missing OPENAI_API_KEY. Add it to `.streamlit/secrets.toml` like:\n\n`OPENAI_API_KEY = \"sk-...\"`")
        elif prefs.empty:
            st.error("Save your preferences first (see section above).")
        elif logs.empty:
            st.error("Add at least one daily log before generating a plan.")
        else:
            with st.spinner("Generating plan... (this may take 10-20 seconds)"):
                try:
                    data = generate_plan_with_openai(pref, last14, week_of, max_tokens=2400, temperature=0.4)
                    if not _ok(data):
                        data = generate_plan_with_openai(pref, last14, week_of, max_tokens=2800, temperature=0.35)

                    if not _ok(data):
                        st.error("Plan incomplete after retry. Add more logs or adjust targets, then try again.")
                        st.warning("Model returned JSON below; review why it failed checks:")
                        try:
                            st.code(json.dumps(data, indent=2, ensure_ascii=False) if isinstance(data, dict) else str(data))
                        except (TypeError, ValueError):
                            st.code(str(data))
                    else:
                        backup_csv("plan.csv")
                        plan.loc[len(plan)] = [
                            str(week_of),
                            json.dumps(data.get("workouts", []), ensure_ascii=False),
                            json.dumps(data.get("meals", []), ensure_ascii=False),
                            json.dumps(data.get("shopping_list", []), ensure_ascii=False),
                        ]
                        plan.to_csv("plan.csv", index=False)
                        st.success("Plan generated and saved")
                except KeyError:
                    st.error("Missing OPENAI_API_KEY. Check your `.streamlit/secrets.toml` file.")
                except json.JSONDecodeError:
                    st.error("The AI returned invalid JSON. Try again or use the manual paste option below.")
                except Exception as e:
                    error_type = type(e).__name__
                    if "RateLimit" in error_type:
                        st.error("Rate limited by OpenAI. Wait a minute and try again.")
                    elif "Authentication" in error_type:
                        st.error("Invalid API key. Check your `.streamlit/secrets.toml` file.")
                    else:
                        st.error(f"Generation failed ({error_type}): {e}")

with colB:
    st.caption("Or use the manual prompt above and paste JSON below.")

# ================== Paste JSON (manual fallback) ==================
json_in = st.text_area("Paste plan JSON (manual mode)", height=160, placeholder='{"workouts":[...],"meals":[...],"shopping_list":[...]}')
if st.button("Save pasted plan JSON"):
    if not json_in.strip():
        st.warning("Paste some JSON first.")
    else:
        try:
            data = json.loads(json_in)
            if not _ok(data):
                st.warning("JSON parsed but missing required fields. Each workout needs: day, session_type, main. Each meal needs: day, breakfast, lunch, dinner, kcal.")
            else:
                backup_csv("plan.csv")
                plan.loc[len(plan)] = [
                    str(week_of),
                    json.dumps(data.get("workouts", []), ensure_ascii=False),
                    json.dumps(data.get("meals", []), ensure_ascii=False),
                    json.dumps(data.get("shopping_list", []), ensure_ascii=False),
                ]
                plan.to_csv("plan.csv", index=False)
                st.success("Plan saved")
        except json.JSONDecodeError as e:
            st.error(f"Invalid JSON (check for missing commas or brackets): {e}")
        except (KeyError, TypeError) as e:
            st.error(f"Unexpected data structure: {e}")

# ================== Current Plan Preview ==================
st.subheader("Current plan preview (raw)")
if len(plan):
    st.dataframe(plan.tail(1), use_container_width=True)
else:
    st.info("No plan saved yet.")

# ================== Readable Plan Tables ==================
st.subheader("Readable plan")
try:
    last = plan.tail(1).iloc[0]
    workouts = pd.DataFrame(json.loads(last["workouts"])) if last["workouts"] else pd.DataFrame()
    meals    = pd.DataFrame(json.loads(last["meals"]))    if last["meals"] else pd.DataFrame()
    shopping = json.loads(last["shopping_list"])          if last["shopping_list"] else []

    if not workouts.empty:
        st.markdown("**Workouts (Mon-Sun)**")
        st.dataframe(workouts, use_container_width=True)
    else:
        st.info("No workouts to display.")

    if not meals.empty:
        st.markdown("**Meals (Mon-Sun)**")
        cols = ["day","breakfast","lunch","dinner","snacks","kcal","protein_g","carbs_g","fat_g"]
        show = [c for c in cols if c in meals.columns]
        st.dataframe(meals[show], use_container_width=True)
    else:
        st.info("No meals to display.")

    if shopping:
        st.markdown("**Shopping list**")
        for item in shopping:
            st.write("\u2022", item)
    else:
        st.info("No shopping list items.")
except (IndexError, json.JSONDecodeError, KeyError):
    st.info("No plan to display yet.")
except Exception as e:
    logger.warning("Failed to render plan tables: %s", e)
    st.info("Plan saved, but could not render tables.")
