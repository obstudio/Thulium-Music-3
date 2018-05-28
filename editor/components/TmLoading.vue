<template>
  <div class="full-screen" style="background-color: #2d2d2d; z-index: 33; display: flex; align-items: center; justify-content: center; flex-direction: column">
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
      height="60%" viewBox="0 0 1000 1000" enable-background="new 0 0 1000 1000" xml:space="preserve">
      <g>
        <path fill="#00A0E9" d="M836.15,454.53c90.25,18.32,158.21,98.11,158.21,193.791c0,109.22-88.54,197.729-197.75,197.729h-568.5c-122.87,0-222.46-99.6-222.46-222.46c0-96.97,62.07-179.44,148.62-209.9c-0.22-4.15-0.32-8.34-0.32-12.57c0-136.5,110.67-247.17,247.18-247.17c91.59,0,171.54,49.82,214.24,123.84c23.55-15.77,51.88-24.97,82.37-24.97c81.91,0,148.29,66.41,148.29,148.3c0,18.84-3.511,36.84-9.9,53.41H836.15z M569.07,330.54c0,0-3.4-3.95-12.53-10.1c-28.78-19.4-64.45-29.11-98.33-31.92c-10.33-0.86-23.36-1.46-33.73-1.62c-25.17-0.38-53.61,3.05-76.72,14.4L492.81,615.11c-22.67-12.301-52.2-18.33-83.75-15.301c-65.69,6.311-115.29,49.521-110.78,96.53c4.51,47,61.43,79.99,127.13,73.69c65.69-6.311,115.29-49.53,110.78-96.53c-0.53-5.48-1.771-10.77-3.65-15.83h-0.01L424.34,315.88c6.1-2.72,35.51-4.39,52.38-4.1c22.98,0.39,59.32,7.82,69.48,10.78C555.89,325.38,569.07,330.54,569.07,330.54z"></path>
      </g>
    </svg>
    <div class="progress">
      <div class="progress-bar active" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 100%">
        <span>Please wait</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TmLoading'
}
</script>

<style scoped>
.progress {
    margin: 0 auto;
    vertical-align: baseline;
    display: flex;
    height: 1rem;
    overflow: hidden;
    font-size: 0.75rem;
    background-color: #e9ecef;
    border-radius: 0.25rem;
    width: 500px;
    text-align: center;
}

@-webkit-keyframes progress-bar-stripes {
    from {
        background-position: 1rem 0;
    }
    to {
        background-position: 0 0;
    }
}

@keyframes progress-bar-stripes {
    from {
        background-position: 1rem 0;
    }
    to {
        background-position: 0 0;
    }
}

.progress .progress-bar.active {
    font-weight: 700;
    animation: progress-bar-stripes .5s linear infinite;
}

.progress-bar {
    display: flex;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
    -ms-flex-direction: column;
    flex-direction: column;
    -webkit-box-pack: center;
    -ms-flex-pack: center;
    justify-content: center;
    color: #fff;
    text-align: center;
    white-space: nowrap;
    background-color: #007bff;
    transition: width 0.6s ease;
    background-image: linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent);
    background-size: 1rem 1rem;
}
</style>
