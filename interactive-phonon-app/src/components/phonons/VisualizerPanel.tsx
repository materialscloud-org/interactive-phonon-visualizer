import { useState } from "react";
import {
  Button,
  Form,
  InputGroup,
  Spinner,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";

import { VisualizerProps } from "./interfaces";

import PhononVisualizer from "mc-react-phonon-visualizer";

import SparkMD5 from "spark-md5";

import "./VisualizerPanel.scss";

const VisualizerPanel = ({
  callback,
  props,
}: {
  callback: () => void;
  props: VisualizerProps | null;
}) => {
  const [shareUrl, setShareUrl] = useState<string>("");

  const handleShare = async () => {
    if (!props) return;

    const blob = new Blob([JSON.stringify(props)], {
      type: "application/json",
    });

    // Compute MD5 hash of the JSON content
    const fullHash = SparkMD5.hash(JSON.stringify(props));
    const hash = fullHash.slice(0, 8);

    console.log(hash)

    const formData = new FormData();
    formData.append("file", new File([blob], "phononvis.json"));
    formData.append("key", hash);

    try {
      const res = await fetch("/share_phononvis", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      const url = `${window.location.origin}/?result_id=${data.result_id}`;
      setShareUrl(url);

      // Update search params in URL
      const params = new URLSearchParams(window.location.search);
      params.set("result_id", data.result_id);
      window.history.replaceState({}, "", `?${params.toString()}`);
    } catch (err) {
      console.error("Failed to generate shareable link:", err);
      setShareUrl("Failed to generate link, try again later");
    }
  };

  const copyToClipboard = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
  };

  const handleBack = () => {
    // Clear search params
    window.history.replaceState({}, "", window.location.pathname);
    callback();
  };

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-4 px-3">
        <Button onClick={handleBack}>
          <i className="bi bi-arrow-left" /> Back
        </Button>

        <h2 className="mb-0 text-center flex-grow-1">
          {props ? (
            <span>Phonon dispersion: {props.title}</span>
          ) : (
            <span>
              Loading <Spinner />
            </span>
          )}
        </h2>

        {/* spacer to keep title centered */}
        <div style={{ width: "90px" }} />
      </div>
      {props && <PhononVisualizer props={props} />}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "0.5rem",
          marginTop: "1rem",
          flexWrap: "wrap",
        }}
      >
        {/* URL input box */}
        {shareUrl && (
          <InputGroup style={{ maxWidth: "400px" }}>
            <Form.Control value={shareUrl} readOnly />
            <Button onClick={copyToClipboard}>Copy</Button>
          </InputGroup>
        )}

        {/* Share via URL button */}
        <OverlayTrigger
          placement="top"
          overlay={
            <Tooltip id="share-tooltip">
              The URL generated is typically valid for weeks, but may not persist forever.
            </Tooltip>
          }
        >
          <Button onClick={handleShare}>
            <i className="bi bi-link-45deg" /> Share via URL
          </Button>
        </OverlayTrigger>

        {/* Download JSON button */}
        <Button
          onClick={() => {
            if (!props) return;
            const blob = new Blob([JSON.stringify(props, null, 2)], {
              type: "application/json",
            });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = `interactive_phonon_vis.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            URL.revokeObjectURL(url);
          }}
        >
          <i className="bi bi-download" /> Download JSON
        </Button>
      </div>
    </>
  );
};

export default VisualizerPanel;
