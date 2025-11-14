# Kaggle GPU Training Setup

## 🚀 Quick Start

### Step 1: Create Kaggle Notebook

1. Go to [Kaggle.com](https://www.kaggle.com)
2. Click "New Notebook"
3. **Enable GPU**: Settings → Accelerator → GPU T4 x2 (free tier)
4. Upload `train_model.py` or copy-paste the code

### Step 2: Add Dataset

**Option A: Use Kaggle Crypto Dataset**
1. Click "Add Data" in notebook
2. Search for "Cryptocurrency Historical Prices" or similar
3. Add dataset to notebook
4. Update file path in `train_model.py` if needed

**Option B: Use CoinGecko API (No dataset needed)**
- The script will automatically fetch data if Kaggle dataset not found
- Uses 365 days of historical data

### Step 3: Install Dependencies

In Kaggle notebook, add this cell:
```python
!pip install tensorflowjs
```

### Step 4: Run Training

```python
# Copy the entire train_model.py code into a cell and run
# Or import it if you uploaded as a file
```

### Step 5: Download Model Files

After training completes, download:
- `model/` folder (TensorFlow.js model)
- `scaler-params.json`
- `model_keras.h5` (optional backup)

### Step 6: Add to Your Project

1. Place `model/` folder in `public/model/`
2. Place `scaler-params.json` in `public/scaler-params.json`
3. Commit to GitHub
4. Deploy to Vercel

## 📊 Expected Results

With GPU training on large dataset:
- **Training time**: 5-15 minutes (vs hours on CPU)
- **Accuracy**: 60-70% (better than 50/50)
- **Model size**: ~100-200KB (still lightweight)
- **Inference**: <50ms on Edge

## 🎯 Tips

1. **Use GPU**: Makes training 10-100x faster
2. **More data**: Use 365+ days for better accuracy
3. **Monitor**: Watch validation metrics to avoid overfitting
4. **Export**: Always download model files before closing notebook

## 🔧 Troubleshooting

**GPU not available?**
- Check if GPU is enabled in notebook settings
- Free tier: GPU T4 x2 (30 hours/week)

**Out of memory?**
- Reduce batch size (256 → 128)
- Use less data (365 days → 180 days)

**Model too large?**
- Reduce model size (64→32→16→8 instead of 64→32→16→8)
- The script already uses a compact architecture

## 📝 Kaggle Notebook Template

```python
# Cell 1: Install dependencies
!pip install tensorflowjs

# Cell 2: Copy train_model.py code here
# ... (paste entire train_model.py)

# Cell 3: Run training
model, scaler = train_model()
```

## 🎉 After Training

1. Download all output files
2. Extract `model/` folder
3. Copy to your project:
   ```bash
   cp -r model/ /path/to/project/public/
   cp scaler-params.json /path/to/project/public/
   ```
4. Test locally: `npm run dev`
5. Commit and push to GitHub
6. Deploy to Vercel

Your model will now run on Vercel Edge with fast inference! 🚀

